import { useEffect, useRef, useState } from "react";
import {
  createRequest,
  deleteRequest,
  fetchRequests,
  updateRequest,
} from "./api";
import LoginForm from "./LoginForm";
import ChatPanel from "./ChatPanel";
import "./App.css";

const STATUS_LABELS = {
  new: "Новая",
  in_progress: "В работе",
  completed: "Выполнена",
};

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3002";

const notifyStatus = async ({ requestId, status, changedBy }) => {
  try {
    await fetch(`${SOCKET_URL}/api/notify/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: String(requestId), status, changedBy }),
    });
  } catch {
    return null;
  }

  return true;
};

const decodeToken = (token) => {
  try {
    const base64 = token
      .split(".")[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));

    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
};

const readRole = () => {
  const token = localStorage.getItem("token");

  if (!token) return "";

  const payload = decodeToken(token);

  return payload && payload.role ? payload.role : "";
};

const getErrorMessage = (err, fallback) => {
  if (err.response) {
    if (err.response.status === 401) {
      return "Сессия истекла: войдите заново";
    }

    if (err.response.status === 403) {
      return "Нет прав на это действие";
    }

    if (err.response.data && err.response.data.error) {
      return err.response.data.error;
    }
  }

  return `${fallback}. Попробуйте ещё раз`;
};

function RequestList() {
  const [requests, setRequests] = useState([]);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editDescription, setEditDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState(localStorage.getItem("userEmail") || "");
  const [role, setRole] = useState(readRole());
  const [loginOpen, setLoginOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [chatRequest, setChatRequest] = useState(null);
  const [creating, setCreating] = useState(false);
  const [toasts, setToasts] = useState([]);

  const descriptionRef = useRef(null);
  const autoOpened = useRef(false);
  const skipSearch = useRef(true);

  const isAdmin = role === "admin";
  const isLoggedIn = Boolean(email);

  useEffect(() => {
    if (!isLoggedIn && !autoOpened.current) {
      autoOpened.current = true;
      setLoginOpen(true);
    }
  }, [isLoggedIn]);

  const pushToast = (text, kind = "info") => {
    const id = Date.now() + Math.random();

    setToasts((prev) => [...prev, { id, text, kind }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  };

  const closeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const loadRequests = async (searchValue) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetchRequests(searchValue);

      setRequests(response.data);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("userEmail");
        setEmail("");
        setRole("");
        setLoginOpen(true);
      }

      setError(getErrorMessage(err, "Не удалось загрузить заявки"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (localStorage.getItem("token")) {
      loadRequests("");
    }
  }, []);

  useEffect(() => {
    if (skipSearch.current) {
      skipSearch.current = false;
      return undefined;
    }

    if (!isLoggedIn) {
      setRequests([]);
      return undefined;
    }

    const timer = setTimeout(() => {
      loadRequests(search);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!isLoggedIn) {
      document.title = "Road Help · сервис для эвакуации и помощи на дорогах";
      return;
    }

    const newCount = requests.filter((r) => r.status === "new").length;

    document.title =
      newCount > 0 ? `(${newCount}) Road Help` : "Road Help";
  }, [requests, isLoggedIn]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setComposerOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (composerOpen && descriptionRef.current) {
      descriptionRef.current.focus();
    }
  }, [composerOpen]);

  const handleCreate = async (event) => {
    event.preventDefault();

    if (!description.trim()) return;

    const tempId = Date.now();

    const newItem = {
      id: tempId,
      description: description.trim(),
      location: location.trim() || "Адрес уточняется",
      status: "new",
      pending: true,
    };

    setRequests((prev) => [newItem, ...prev]);
    setDescription("");
    setLocation("");
    setCreating(true);

    try {
      const response = await createRequest({
        description: newItem.description,
        location: newItem.location,
      });

      setRequests((prev) =>
        prev.map((r) => (r.id === tempId ? response.data : r)),
      );
      setComposerOpen(false);
      pushToast("Заявка создана");
    } catch (err) {
      setRequests((prev) => prev.filter((r) => r.id !== tempId));
      pushToast(getErrorMessage(err, "Не удалось создать заявку"), "error");
    } finally {
      setCreating(false);
    }
  };

  const removeRequest = async (id) => {
    const removed = requests.find((r) => r.id === id);

    setRequests((prev) => prev.filter((r) => r.id !== id));

    try {
      await deleteRequest(id);
      pushToast(isAdmin ? "Заявка удалена" : "Заявка отменена");
    } catch (err) {
      setRequests((prev) => [...prev, removed].sort((a, b) => a.id - b.id));
      pushToast(getErrorMessage(err, "Не удалось удалить заявку"), "error");
    }
  };

  const changeStatus = async (request, nextStatus) => {
    const previousStatus = request.status;

    setRequests((prev) =>
      prev.map((r) => (r.id === request.id ? { ...r, status: nextStatus } : r)),
    );

    try {
      await updateRequest(request.id, {
        description: request.description,
        location: request.location,
        status: nextStatus,
      });
      pushToast(`Статус: ${STATUS_LABELS[nextStatus]}`);
      notifyStatus({
        requestId: request.id,
        status: STATUS_LABELS[nextStatus],
        changedBy: email || "диспетчер",
      });
    } catch (err) {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === request.id ? { ...r, status: previousStatus } : r,
        ),
      );
      pushToast(getErrorMessage(err, "Не удалось изменить статус"), "error");
    }
  };

  const startEdit = (request) => {
    setEditingId(request.id);
    setEditDescription(request.description);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDescription("");
  };

  const saveEdit = async () => {
    if (!editDescription.trim()) return;

    const target = requests.find((r) => r.id === editingId);

    if (!target) return;

    const id = editingId;
    const previousDescription = target.description;
    const nextDescription = editDescription.trim();

    setRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, description: nextDescription } : r,
      ),
    );
    cancelEdit();

    try {
      await updateRequest(id, {
        description: nextDescription,
        location: target.location,
      });
      pushToast("Изменения сохранены");
    } catch (err) {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, description: previousDescription } : r,
        ),
      );
      pushToast(getErrorMessage(err, "Не удалось сохранить изменения"), "error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    setEmail("");
    setRole("");
    setRequests([]);
    setLoginOpen(true);
  };

  const handleLogin = (userEmail) => {
    setEmail(userEmail);
    setRole(readRole());
    setLoginOpen(false);
    pushToast(`Вы вошли как ${userEmail}`);

    if (search) {
      setSearch("");
    } else {
      loadRequests("");
    }
  };

  const filteredRequests =
    filter === "all" ? requests : requests.filter((r) => r.status === filter);

  const newCount = requests.filter((r) => r.status === "new").length;
  const inProgressCount = requests.filter(
    (r) => r.status === "in_progress",
  ).length;
  const completedCount = requests.filter(
    (r) => r.status === "completed",
  ).length;

  return (
    <div className="page">
      <header className="hero">
        <div className="hero__stripes" aria-hidden="true" />

        <div className="hero__inner">
          <div className="hero__top">
            <div className="brand">
              <span className="brand__mark" aria-hidden="true">
                RH
              </span>
              <span className="brand__name">Road Help</span>
            </div>

            <div className="hero__session">
              {isLoggedIn ? (
                <>
                  <span className="hero__user">{email}</span>
                  <button className="btn btn--light btn--sm" onClick={handleLogout}>
                    Выйти
                  </button>
                </>
              ) : (
                <button
                  className="btn btn--light btn--sm"
                  onClick={() => setLoginOpen(true)}
                >
                  Войти
                </button>
              )}
            </div>
          </div>

          <h1 className="hero__title">
            Сервис для эвакуации и помощи на дорогах
          </h1>

          {isLoggedIn && (
            <dl className="hero__stats">
              <div className="hero__stat">
                <dt className="hero__stat-label">Всего</dt>
                <dd className="hero__stat-value">{requests.length}</dd>
              </div>
              <div className="hero__stat">
                <dt className="hero__stat-label">Новые</dt>
                <dd className="hero__stat-value">{newCount}</dd>
              </div>
              <div className="hero__stat">
                <dt className="hero__stat-label">В работе</dt>
                <dd className="hero__stat-value">{inProgressCount}</dd>
              </div>
              <div className="hero__stat">
                <dt className="hero__stat-label">Выполнены</dt>
                <dd className="hero__stat-value">{completedCount}</dd>
              </div>
            </dl>
          )}

          {isLoggedIn && (
            <div className="hero__actions">
              <button
                className="btn btn--amber"
                onClick={() => setComposerOpen(true)}
              >
                Новая заявка
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="board">
        {isLoggedIn && (
          <>
            <div className="board__bar">
              <label className="field board__search">
                <span className="field__label">Поиск по описанию</span>
                <input
                  className="input"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Например: колесо"
                />
              </label>

              <label className="field board__filter">
                <span className="field__label">Статус</span>
                <select
                  className="select"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">Все</option>
                  <option value="new">Новые</option>
                  <option value="in_progress">В работе</option>
                  <option value="completed">Выполненные</option>
                </select>
              </label>

              <p className="board__count">
                {isAdmin ? "Все заявки" : "Мои заявки"}: {filteredRequests.length}{" "}
                из {requests.length}
              </p>
            </div>

            {error && (
              <div className="toast toast--error" role="alert">
                <span>{error}</span>
                <button
                  className="toast__close"
                  onClick={() => loadRequests(search)}
                >
                  Повторить
                </button>
              </div>
            )}

            {loading && (
              <>
                <div className="loading-row" role="status">
                  <span className="spinner" aria-hidden="true" />
                  Загрузка заявок
                </div>
                <div className="cards" aria-hidden="true">
                  {[0, 1, 2, 3].map((item) => (
                    <div className="skeleton-card" key={item}>
                      <span className="skeleton-line skeleton-line--short" />
                      <span className="skeleton-line" />
                      <span className="skeleton-line skeleton-line--short" />
                    </div>
                  ))}
                </div>
              </>
            )}

            {!loading && !error && filteredRequests.length === 0 && (
              <div className="empty">
                <p className="empty__title">Заявок нет</p>
                <p className="empty__text">
                  {search || filter !== "all"
                    ? "По текущему поиску и фильтру ничего не найдено. Измените условия или очистите поиск."
                    : "Пока ни одной заявки. Создайте первую, чтобы сервис начал работу."}
                </p>
                {!search && filter === "all" && (
                  <button
                    className="btn btn--amber"
                    onClick={() => setComposerOpen(true)}
                  >
                    Новая заявка
                  </button>
                )}
              </div>
            )}

            {!loading && filteredRequests.length > 0 && (
              <ul className="cards">
                {filteredRequests.map((r) => (
                  <li
                    className={r.pending ? "card card--pending" : "card"}
                    key={r.id}
                  >
                    <span
                      className={`card__rail card__rail--${r.status}`}
                      aria-hidden="true"
                    />

                    {editingId === r.id ? (
                      <div className="card__edit">
                        <label className="field">
                          <span className="field__label">Описание заявки</span>
                          <input
                            className="input"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                          />
                        </label>
                        <div className="card__actions">
                          <button
                            className="btn btn--amber btn--sm"
                            onClick={saveEdit}
                          >
                            Сохранить
                          </button>
                          <button
                            className="btn btn--quiet btn--sm"
                            onClick={cancelEdit}
                          >
                            Отмена
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="card__head">
                          {isAdmin ? (
                            <select
                              className={`select select--status select--status-${r.status}`}
                              value={r.status}
                              onChange={(e) => changeStatus(r, e.target.value)}
                              aria-label={`Статус заявки ${r.id}`}
                            >
                              <option value="new">Новая</option>
                              <option value="in_progress">В работе</option>
                              <option value="completed">Выполнена</option>
                            </select>
                          ) : (
                            <span className={`chip chip--${r.status}`}>
                              {STATUS_LABELS[r.status] || r.status}
                            </span>
                          )}
                        </div>

                        <h2 className="card__title">{r.description}</h2>

                        <p className="card__place">
                          <span className="card__pin" aria-hidden="true" />
                          {r.location}
                          {r.pending ? " · отправляем…" : ""}
                        </p>

                        <div className="card__actions">
                          <button
                            className="btn btn--quiet btn--sm"
                            onClick={() => setChatRequest(r)}
                            aria-label={`Открыть чат по заявке ${r.id}`}
                          >
                            Чат
                          </button>
                          <button
                            className="btn btn--quiet btn--sm"
                            onClick={() => startEdit(r)}
                            aria-label={`Изменить заявку ${r.id}`}
                          >
                            Изменить
                          </button>
                          <button
                            className="btn btn--danger btn--sm"
                            onClick={() => removeRequest(r.id)}
                            aria-label={`Удалить заявку ${r.id}`}
                          >
                            {isAdmin ? "Удалить" : "Отменить"}
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>

      {composerOpen && (
        <div
          className="veil"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setComposerOpen(false);
          }}
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="composer-title"
          >
            <div className="modal__head">
              <h2 className="modal__title" id="composer-title">
                Новая заявка
              </h2>
              <button
                className="modal__close"
                onClick={() => setComposerOpen(false)}
                aria-label="Закрыть окно"
              >
                ×
              </button>
            </div>

            <form className="modal__body" onSubmit={handleCreate}>
              <label className="field">
                <span className="field__label">Что случилось</span>
                <input
                  className="input"
                  ref={descriptionRef}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Например: пробил колесо"
                  required
                />
              </label>

              <label className="field">
                <span className="field__label">Где вы находитесь</span>
                <input
                  className="input"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Город, улица, ориентир"
                />
              </label>

              <div className="modal__actions">
                <button
                  className="btn btn--quiet"
                  type="button"
                  onClick={() => setComposerOpen(false)}
                >
                  Отмена
                </button>
                <button
                  className="btn btn--amber"
                  type="submit"
                  disabled={creating}
                >
                  {creating ? "Отправляем…" : "Создать заявку"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {loginOpen && (
        <div className="veil">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-title"
          >
            <div className="modal__head">
              <h2 className="modal__title" id="login-title">
                Вход в систему
              </h2>
            </div>

            <LoginForm onLogin={handleLogin} />
          </section>
        </div>
      )}

      {chatRequest && (
        <ChatPanel
          requestId={chatRequest.id}
          user={email || "Гость"}
          onClose={() => setChatRequest(null)}
        />
      )}

      {toasts.length > 0 && (
        <div className="toasts" aria-live="polite">
          {toasts.map((toast) => (
            <div
              className={toast.kind === "error" ? "toast toast--error" : "toast"}
              key={toast.id}
              role={toast.kind === "error" ? "alert" : "status"}
            >
              <span>{toast.text}</span>
              <button
                className="toast__close"
                onClick={() => closeToast(toast.id)}
                aria-label="Скрыть уведомление"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RequestList;
