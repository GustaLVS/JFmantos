import { SHIELD_LOGO } from "../assets.js";
import AuthShortcuts from "../components/AuthShortcuts.jsx";
import { authErrorMessage, signInCustomer } from "../services/authApi.js";

export default function LoginPage({ showToast, goTo }) {
  return (
    <section className="page active auth-page">
      <div className="login-layout auth-shell">
        <AuthShortcuts goTo={goTo} />
        <form className="login-form" onSubmit={async (event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          try {
            await signInCustomer({
              email: data.get("email").trim(),
              password: data.get("password"),
            });
            showToast("Login realizado com sucesso.");
            goTo("home");
          } catch (error) {
            console.error(error);
            showToast(authErrorMessage(error));
          }
        }}>
          <div className="auth-brand">
            <img src={SHIELD_LOGO} alt="JFMANTOS" />
            <span>JFMANTOS</span>
          </div>
          <span className="eyebrow">Area do cliente</span>
          <h1>Entre na sua conta.</h1>
          <p>Acesse seus pedidos, acompanhe compras e salve suas camisas favoritas.</p>
          <label>E-mail<input required type="email" name="email" placeholder="voce@email.com" autoComplete="email" /></label>
          <label>Senha<input required type="password" name="password" placeholder="Sua senha" autoComplete="current-password" /></label>
          <div className="login-options">
            <label><input type="checkbox" name="remember" />Lembrar acesso</label>
            <button className="text-button" type="button">Esqueci minha senha</button>
          </div>
          <button className="button primary full" type="submit">Entrar</button>
          <div className="login-divider"><span>ou</span></div>
          <button className="button ghost full" type="button" onClick={() => goTo("cadastro")}>Criar conta</button>
          <p className="login-note">Login conectado ao Supabase Auth.</p>
        </form>
      </div>
    </section>
  );
}
