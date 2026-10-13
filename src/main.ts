import "./styles.css";
import { initUI } from "./ui";

initUI();

function semCena3D(): void {
  document.body.classList.add("nogl");
  document.body.classList.remove("intro");
}

// A cena 3D (Three.js) é carregada à parte, depois da interface.
// Se o WebGL ou o carregamento falharem, o site continua completo, sem a cena 3D.
import("./scene/experience")
  .then(({ startExperience }) => {
    if (!startExperience(`${import.meta.env.BASE_URL}logo.jpg`)) semCena3D();
  })
  .catch(semCena3D);
