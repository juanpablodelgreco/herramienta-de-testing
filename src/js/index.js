function showMetrics() {
  const inputCode = document.getElementById("input-code").value.toLowerCase();
  const regex = /^\s*?(((public|private|protected|static|final|native|synchronized|abstract|threadsafe|transient)\s+?)*)\s*?(\w+?)\s+?(\w+?)\s*?\(([^)]*)\)[\w\s,]*?(\{)?\s*?$/gm;
  if (!inputCode.match(regex)) {
    Swal.fire({
      title: 'Ingrese un codigo por favor.',
      text: "Debe ingresar una función correspondiente a la sintaxis de java a analizar.",
      icon: 'warning',
    }
    );
    return;
  }

  const { complex, blanks, comments, totalLines } = analizeCode(inputCode);
  const codeLines = parseInt(totalLines - comments - blanks);
  const percentOfComments = (parseFloat((parseInt(comments) / parseInt(totalLines)) * 100).toFixed(2)) + "%";
  if (!isNaN(percentOfComments)) percentOfComments = 0 + "%";

  const { cantUniqueOperators, cantTotalOperators } = getOperators(inputCode);
  const { cantUniqueOperands, cantTotalOperands } = getOperands(inputCode);
  const halsteadLength = getHalsteadLength(cantUniqueOperators, cantUniqueOperands);
  const halsteadVolume = getHalsteadVolume(cantUniqueOperators, cantUniqueOperands, cantTotalOperators, cantTotalOperands);

  Swal.fire({
    title: 'Reporte',
    html: generateHtml(totalLines, codeLines, complex, blanks, comments, percentOfComments, halsteadLength, halsteadVolume),
  });
}

function analizeCode(inputCode) {
  let complex = 0;
  let blanks = 0;
  let comments = 0;
  const text = inputCode.split('\n');
  for (let i = 0; i < text.length; i++) {
    let hasIf = text[i].split('if(').length - 1 > 0 ? true : false;
    let hasIf2 = text[i].split('if (').length - 1 > 0 ? true : false;
    let hasWhile = text[i].split('while(').length - 1 > 0 ? true : false;
    let hasWhile2 = text[i].split('while (').length - 1 > 0 ? true : false;
    let hasFor = text[i].split('for(').length - 1 > 0 ? true : false;
    let hasFor2 = text[i].split('for (').length - 1 > 0 ? true : false;
    let hasCase = text[i].split('case').length - 1 > 0 ? true : false;
    let ors = text[i].split('||').length - 1;
    let ands = text[i].split('&&').length - 1;

    if (text[i].split('//').length > 1) { comments++; continue; }
    if (text[i] === '') { blanks++; continue; }
    if (ors > 0) complex += ors + 1;
    if (ands > 0) complex += ands + 1;
    if (hasIf && ors == 0 && ands == 0) complex += 1;
    if (hasIf2 && ors == 0 && ands == 0) complex += 1;
    if (hasWhile && ors == 0 && ands == 0) complex += 1;
    if (hasWhile2 && ors == 0 && ands == 0) complex += 1;
    if (hasFor && ors == 0 && ands == 0) complex += 1;
    if (hasFor2 && ors == 0 && ands == 0) complex += 1;
    if (hasCase && ors == 0 && ands == 0) complex += 1;
  }

  complex++;
  return { complex, blanks, comments, totalLines: text.length };
}

function getOperators(inputCode) {
  const operators = ["public", "static", "void", "&&", "||", "<=", ">=", "<", ">", "!=", "!", "+", "-", "/", "*", "int", "double", "float", ";", ":"];
  const text = inputCode.split(' ');
  let cantUniqueOperators = 0;
  let cantTotalOperators = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i].split('//').length > 1) { comments++; continue; }

    if (text.indexOf(operators[i]) != -1)
      cantUniqueOperators++;

    cantTotalOperators += inputCode.split(operators[i]).length - 1;
  }

  return { cantUniqueOperators, cantTotalOperators };
}

function getOperands(inputCode) {
  const operators = ["public", "static", "void", "&&", "||", "<=", ">=", "<", ">", "!=", "!", "+", "-", "/", "*", "int", "double", "float", ";", ":"];
  const text = inputCode.split(' ');
  const uniqueOperands = [];
  let cantUniqueOperands = 0;
  let cantTotalOperands = 0;
  for (let i = 0; i < text.length; i++) {

    if (operators.indexOf(text[i]) == -1 && uniqueOperands.indexOf(text[i]) == -1) {
      uniqueOperands.push(text[i]);
      cantUniqueOperands++;
    }

    if (operators.indexOf(text[i]) == -1)
      cantTotalOperands++;
  }

  return { cantUniqueOperands, cantTotalOperands };
}

function getHalsteadLength(cantUniqueOperators, cantUniqueOperands) {
  return parseInt(cantUniqueOperators * Math.log2(cantUniqueOperators) + cantUniqueOperands * Math.log2(cantUniqueOperands));
}


function getHalsteadVolume(uniqueOperands, cantUniqueOperands, cantTotalOperators, cantTotalOperands) {
  return parseFloat((cantTotalOperators + cantTotalOperands) * Math.log2(uniqueOperands + cantUniqueOperands)).toFixed(2);
}

function generateHtml(totalLines, codeLines, complex, blanks, comments, percentOfComments, halsteadLength, halsteadVolume) {
  let html =
    `
    <h4>Lineas totales: ${totalLines}</h4>
    <h4>Lineas de código: ${codeLines}</h4>
    <h4>Lineas comentadas: ${comments}</h4>
    <h4>Lineas en blanco: ${blanks}</h4>
    <h4>Porcentaje lineas comentadas: ${percentOfComments}</h4>
    <h4>Complejidad ciclomática: ${complex}</h4>
    <h4>Halstead - Longitud: ${halsteadLength}</h4>
    <h4>Halstead - Volumen: ${halsteadVolume}</h4>
    `;

  if (parseInt(percentOfComments.split('%')[0]) < 10) {
    html += `<h4 class="text-warning">El porcentaje de comentarios debería ser mayor a 10%.</h4>`;
  }

  if (complex > 10) {
    html += `<h4 class="text-warning">La complejidad ciclomática no debería ser mayor a 10.</h4>`;
  }

  return html;
}