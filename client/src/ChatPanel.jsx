import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3002";

const formatTime = (value) =>
  new Date(value).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

function ChatPanel({ requestId, user, onClose }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typingUser, setTypingUser] = useState("");
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");

  const socketRef = useRef(null);
  const typingTimerRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ["websocket"] });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      setError("");
      socket.emit("join", { requestId: String(requestId), user });
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("history", (payload) => {
      setMessages(payload.messages);
    });

    socket.on("message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("typing", (payload) => {
      setTypingUser(payload.isTyping ? payload.user : "");
    });

    socket.on("error-message", (payload) => {
      setError(payload.error);
    });

    return () => {
      clearTimeout(typingTimerRef.current);
      socket.disconnect();
    };
  }, [requestId, user]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, typingUser]);

  const sendTyping = (isTyping) => {
    if (!socketRef.current) return;

    socketRef.current.emit("typing", {
      requestId: String(requestId),
      user,
      isTyping,
    });
  };

  const handleChange = (value) => {
    setText(value);
    sendTyping(true);

    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => sendTyping(false), 1200);
  };

  const handleSend = (event) => {
    event.preventDefault();

    const trimmed = text.trim();

    if (!trimmed || !socketRef.current) return;

    clearTimeout(typingTimerRef.current);
    sendTyping(false);

    socketRef.current.emit(
      "message",
      { requestId: String(requestId), user, text: trimmed },
      (ack) => {
        if (ack && ack.ok) {
          setText("");
        }
      },
    );
  };

  return (
    <div
      className="veil"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="modal modal--chat"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-title"
      >
        <div className="modal__head">
          <div>
            <h2 className="modal__title" id="chat-title">
              Чат по заявке
            </h2>
            <p className="chat__subtitle">
              {user} · заявка {requestId}
            </p>
          </div>

          <div className="chat__status">
            <span
              className={connected ? "chat__dot chat__dot--on" : "chat__dot"}
              aria-hidden="true"
            />
            {connected ? "на связи" : "соединение потеряно"}
          </div>

          <button className="modal__close" onClick={onClose} aria-label="Закрыть чат">
            ×
          </button>
        </div>

        <div className="chat__list" ref={listRef}>
          {messages.length === 0 && (
            <p className="chat__empty">Сообщений пока нет — напишите первым.</p>
          )}

          {messages.map((message) => {
            const isSystem = message.type === "system";
            const isOwn = message.author === user;

            return (
              <div
                key={message._id}
                className={
                  isSystem
                    ? "chat__msg chat__msg--system"
                    : isOwn
                      ? "chat__msg chat__msg--own"
                      : "chat__msg"
                }
              >
                <p className="chat__author">
                  {message.author}
                  <span className="chat__time">{formatTime(message.createdAt)}</span>
                </p>
                <p className="chat__text">{message.text}</p>
              </div>
            );
          })}

          {typingUser && <p className="chat__typing">{typingUser} печатает…</p>}
        </div>

        {error && (
          <p className="modal__error chat__error" role="alert">
            {error}
          </p>
        )}

        <form className="chat__form" onSubmit={handleSend}>
          <input
            className="input"
            value={text}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Сообщение по заявке..."
            maxLength={1000}
            aria-label="Текст сообщения"
          />
          <button className="btn btn--amber" type="submit" disabled={!connected}>
            Отправить
          </button>
        </form>
      </section>
    </div>
  );
}

export default ChatPanel;
