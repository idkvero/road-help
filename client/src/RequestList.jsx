import { useEffect, useState } from "react";
import useLocalStorage from "./useLocalStorage";
import "./App.css";

const STORAGE_KEY = "road-help-requests";

const initialRequests = [
  {
    id: 1,
    description: "Разрядился аккумулятор",
    location: "Минск, ул. Ленина, 10",
    status: "new",
  },
  {
    id: 2,
    description: "Спустило колесо",
    location: "Минск, пр. Победителей, 25",
    status: "in_progress",
  },
];

const STATUS_LABELS = {
  new: "Новая",
  in_progress: "В работе",
  completed: "Выполнена",
};

function RequestList() {
  const [requests, setRequests] = useLocalStorage(STORAGE_KEY, initialRequests);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [editDescription, setEditDescription] = useState("");

  useEffect(() => {
    const newCount = requests.filter((r) => r.status === "new").length;

    document.title = newCount > 0 ? `(${newCount}) Road Help` : "Road Help";
  }, [requests]);

  const addRequest = () => {
    if (!description.trim()) return;

    const newRequest = {
      id: Date.now(),
      description: description.trim(),
      location: location.trim() || "Не указано",
      status: "new",
    };

    setRequests([...requests, newRequest]);
    setDescription("");
    setLocation("");
  };

  const deleteRequest = (id) => {
    setRequests(requests.filter((r) => r.id !== id));
  };

  const startEdit = (request) => {
    setEditingId(request.id);
    setEditDescription(request.description);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDescription("");
  };

  const saveEdit = () => {
    if (!editDescription.trim()) return;

    setRequests(
      requests.map((r) =>
        r.id === editingId ? { ...r, description: editDescription.trim() } : r,
      ),
    );

    cancelEdit();
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
    <div className="request-list">
      <h1>Заявки на помощь на дорогах</h1>

      <div className="form-row">
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Что случилось?"
        />
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Где вы находитесь?"
        />
        <button onClick={addRequest}>Добавить</button>
      </div>

      <div className="toolbar">
        <label>
          Фильтр:{" "}
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Все</option>
            <option value="new">Новые</option>
            <option value="in_progress">В работе</option>
            <option value="completed">Выполненные</option>
          </select>
        </label>
        <span className="stats">
          Всего: {requests.length} · Новых: {newCount} · В работе:{" "}
          {inProgressCount} · Выполнено: {completedCount}
        </span>
      </div>

      <ul className="request-items">
        {filteredRequests.map((r) => (
          <li key={r.id} className="request-item">
            {editingId === r.id ? (
              <>
                <input
                  className="edit-input"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
                <button onClick={saveEdit}>Сохранить</button>
                <button onClick={cancelEdit}>Отмена</button>
              </>
            ) : (
              <>
                <div className="request-info">
                  <b>{r.description}</b>
                  <div className="request-location">{r.location}</div>
                </div>
                <span className={`badge badge-${r.status}`}>
                  {STATUS_LABELS[r.status] || r.status}
                </span>
                <button onClick={() => startEdit(r)}>Редактировать</button>
                <button onClick={() => deleteRequest(r.id)}>Удалить</button>
              </>
            )}
          </li>
        ))}
      </ul>

      {filteredRequests.length === 0 && <p className="empty">Заявок нет.</p>}
    </div>
  );
}

export default RequestList;
