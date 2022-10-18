function setInfoHTML(infoHTML) {
  document.getElementById(RESULT_CONTAINER_ID).innerHTML = infoHTML
}

function appendInfoHTML(infoHTML) {
  document.getElementById(RESULT_CONTAINER_ID).innerHTML += infoHTML
}

function clearCode() {
  document.getElementById(INPUT_CODE_ID).value = "";
  setInfoHTML("");
}

function getInputCode() {
  return document.getElementById(INPUT_CODE_ID).value;
}

function addResultsTitle() {
  setInfoHTML("<h2>Funciones detectadas...</h2>")
}

function generateHtml({fnSign, totalLines, codeLines, complex, fanIn, fanOut, blanks, comments, percentOfComments, halsteadLength, halsteadVolume}) {
  const formatedFnSing = fnSign.trim().replaceAll("<", "&#60").replaceAll(">", "&#62")
  let html =
    `
    <div id="${formatedFnSing}" class="result neomorphism closed">
      <h4><strong>${formatedFnSing}</strong></h4>
      <div class="report">
        <h4>Lineas totales: ${totalLines}</h4>
        <h4>Lineas de código: ${codeLines}</h4>
        <h4>Lineas comentadas: ${comments}</h4>
        <h4>Lineas en blanco: ${blanks}</h4>
        <h4>Porcentaje lineas comentadas: ${percentOfComments}</h4>
        <h4>Complejidad ciclomática: ${complex}</h4>
        <h4>Fan in: ${fanIn}</h4>
        <h4>Fan out: ${fanOut}</h4>
        <h4>Halstead - Longitud: ${halsteadLength}</h4>
        <h4>Halstead - Volumen: ${halsteadVolume}</h4>      
    `;

  if (parseInt(percentOfComments.split('%')[0]) < 10) {
    html += `<h4 class="text-danger">El porcentaje de comentarios debería ser mayor a 10%.</h4>`;
  }

  if (parseInt(fanIn) > 5) {
    html += `<h4 class="text-warning">Este método es crítico debido a que es llamado por mas de 5 métodos. Por lo tanto debería ser testeado en profundidad.</h4>`;
  }

  if (parseInt(fanOut) > 4) {
    html += `<h4 class="text-warning">Es recomendable que el fanOut no sea superior a 4.</h4>`;
  }

  if (complex > 10) {
    html += `<h4 class="text-danger">La complejidad ciclomática no debería ser mayor a 10.</h4>`;
  }

  html += `
      </div>
      <button class="btn btn-success p-2" onclick="showReport('${formatedFnSing}')">Generar reporte</button>      
    </div>
  `

  return html;
}

function showReport(id) {
  const resultContainer = document.getElementById(id)
  resultContainer.classList.remove("closed")
  resultContainer.classList.add("opened")
}