import { SHIELD_LOGO } from "../assets.js";
import AuthShortcuts from "../components/AuthShortcuts.jsx";
import { authErrorMessage, signUpCustomer } from "../services/authApi.js";

export default function SignupPage({ showToast, goTo }) {
  return (
    <section className="page active auth-page">
      <div className="login-layout signup-layout auth-shell">
        <AuthShortcuts goTo={goTo} />
        <form className="login-form signup-form" onSubmit={async (event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          if (data.get("password") !== data.get("confirmPassword")) return showToast("As senhas precisam ser iguais.");
          if (data.get("password").length < 6) return showToast("A senha precisa ter pelo menos 6 caracteres.");
          try {
            const result = await signUpCustomer({
              name: data.get("name").trim(),
              email: data.get("email").trim(),
              phone: data.get("phone").trim(),
              document: data.get("document").trim(),
              password: data.get("password"),
            });
            showToast(result.session ? "Conta criada e login realizado." : "Conta criada. Confira seu e-mail para confirmar o cadastro.");
            goTo(result.session ? "home" : "login");
          } catch (error) {
            console.error(error);
            showToast(authErrorMessage(error));
          }
        }}>
          <div className="auth-brand">
            <img src={SHIELD_LOGO} alt="JFMANTOS" />
            <span>JFMANTOS</span>
          </div>
          <span className="eyebrow">Nova conta</span>
          <h1>Crie seu acesso.</h1>
          <p>Salve seus dados, acompanhe pedidos e monte uma lista de camisas favoritas para comprar depois.</p>
          <div className="form-grid">
            <label>Nome completo<input required name="name" placeholder="Seu nome" autoComplete="name" /></label>
            <label>E-mail<input required type="email" name="email" placeholder="voce@email.com" autoComplete="email" /></label>
            <label>Telefone<input required name="phone" placeholder="(00) 00000-0000" autoComplete="tel" /></label>
            <label>CPF<input name="document" placeholder="000.000.000-00" /></label>
            <label>Senha<input required minLength="6" type="password" name="password" placeholder="Crie uma senha" autoComplete="new-password" /></label>
            <label>Confirmar senha<input required minLength="6" type="password" name="confirmPassword" placeholder="Repita a senha" autoComplete="new-password" /></label>
          </div>
          <label className="terms-check"><input required type="checkbox" name="terms" />Aceito receber novidades e concordo com o cadastro simulado da loja.</label>
          <button className="button primary full" type="submit">Criar minha conta</button>
          <button className="button ghost full" type="button" onClick={() => goTo("login")}>Ja tenho conta</button>
          <p className="login-note">Cadastro conectado ao Supabase Auth.</p>
        </form>
      </div>
    </section>
  );
}
