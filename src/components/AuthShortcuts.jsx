import { SHIELD_LOGO } from "../assets.js";
import { LuShirt } from "react-icons/lu";

export default function AuthShortcuts({ goTo }) {
  return (
    <div className="auth-shortcuts" aria-label="Atalhos">
      <button type="button" aria-label="Voltar para inicio" onClick={() => goTo("home")}>
        <img src={SHIELD_LOGO} alt="JFMANTOS" />
      </button>
      <button type="button" aria-label="Ir para camisas" onClick={() => goTo("produtos")}>
        <LuShirt aria-hidden="true" />
      </button>
    </div>
  );
}
