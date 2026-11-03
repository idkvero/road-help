import { useState } from "react";
import { login, register } from "./api";

function LoginForm({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";

  const switchMode = () => {
    setMode(isRegister ? "login" : "register");
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        await register(email, password);
      }

      const response = await login(email, password);

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("userEmail", email);

      onLogin(email);
    } catch (err) {
      if (err.response) {
        const message =
          err.response.data && err.response.data.error
            ? err.response.data.error
            : "Не удалось выполнить действие";

        setError(message);
      } else {
        setError("Не удалось связаться с сервисом. Попробуйте ещё раз");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="modal__body" onSubmit={handleSubmit}>
      <p className="modal__switch">
        {isRegister
          ? "Создайте аккаунт, чтобы оставлять заявки и следить за их статусом."
          : "Войдите, чтобы оставлять заявки и следить за их статусом."}
      </p>

      <label className="field">
        <span className="field__label">Email</span>
        <input
          className="input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          required
        />
      </label>

      <label className="field">
        <span className="field__label">Пароль</span>
        <input
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={isRegister ? "new-password" : "current-password"}
          minLength={6}
          required
        />
        {isRegister && (
          <span className="hint">Минимум 6 символов</span>
        )}
      </label>

      {error && (
        <p className="modal__error" role="alert">
          {error}
        </p>
      )}

      <div className="modal__actions">
        <button
          className="btn btn--amber btn--wide"
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Проверяем…"
            : isRegister
              ? "Зарегистрироваться"
              : "Войти"}
        </button>
      </div>

      <button className="modal__link" type="button" onClick={switchMode}>
        {isRegister
          ? "Уже есть аккаунт? Войти"
          : "Нет аккаунта? Зарегистрироваться"}
      </button>
    </form>
  );
}

export default LoginForm;
