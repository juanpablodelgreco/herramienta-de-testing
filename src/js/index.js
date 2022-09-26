const JAVA_METHOD_SIGN_REGEX = /^((public|private|protected|static|final|native|synchronized|abstract|threadsafe|transient|\s)+\s*?\w+?\s+?(\w+?)\s*?\([^)]*\)[\w\s,]*?)\{?\s*?$/gm;
const PREDICATOR_REGEX = /((while|if)\s*\(.*\)|case *\w:)/gm
const PARTIAL_FUNCTION_CALL_REGEX = /\s*\(/gm

let inputCode
let functionsListRegex

function showMetrics() {
  inputCode = document.getElementById("input-code").value.toLowerCase();
  functionsListRegex = []
  
  if (!inputCode.match(JAVA_METHOD_SIGN_REGEX)) {
    Swal.fire({
      title: 'Ingrese un codigo por favor.',
      text: "Debe ingresar una función correspondiente a la sintaxis de java a analizar.",
      icon: 'warning',
    }
    );
    return;
  }

  setInfoHTML("")
  functionAnalizer(inputCode)
}

function setInfoHTML(infoHTML) {
  document.getElementById("result_container").innerHTML = infoHTML
}

function appendInfoHTML(infoHTML) {
  document.getElementById("result_container").innerHTML += infoHTML
}

function getInfo({ fnSign, fnName, functionCode, complex, blanks, comments, totalLines }) {
  const codeLines = parseInt(totalLines - comments - blanks);
  const percentOfComments = (parseFloat((parseInt(comments) / parseInt(totalLines)) * 100).toFixed(2)) + "%";
  if (!isNaN(percentOfComments)) percentOfComments = 0 + "%";

  const { cantUniqueOperators, cantTotalOperators } = getOperators(functionCode);
  const { cantUniqueOperands, cantTotalOperands } = getOperands(functionCode);
  const halsteadLength = getHalsteadLength(cantUniqueOperators, cantUniqueOperands);
  const halsteadVolume = getHalsteadVolume(cantUniqueOperators, cantUniqueOperands, cantTotalOperators, cantTotalOperands);
  const fanIn = getFanIn(fnName)
  const fanOut = getFanOut(functionCode)

  return {
    totalLines,
    codeLines,
    complex,
    blanks,
    comments,
    percentOfComments,
    halsteadLength,
    halsteadVolume,
    fnSign,
    fanIn,
    fanOut
  }
}

function analizeCode(functionCode) {
  let complex = 0;
  let blanks = 0;
  let comments = 0;
  const text = functionCode.split('\n');
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

  const newComplex = calculateComplexity(functionCode)

  return { complex: newComplex, blanks, comments, totalLines: text.length };
}

function calculateComplexity(functionCode) {
  const conditionsArray = [...functionCode.matchAll(PREDICATOR_REGEX)]
  let predicatorCount = 0

  conditionsArray.forEach(([condition]) => {
    if(condition.includes("case")) {
      predicatorCount++
    } else {
      predicatorCount+= condition.split("&&").length-1
      predicatorCount+= condition.split("||").length-1    
    }
  })

  return predicatorCount+1 || 1
}

function getOperators(functionCode) {
  const operators = ["public", "static", "void", "&&", "||", "<=", ">=", "<", ">", "!=", "!", "+", "-", "/", "*", "int", "double", "float", ";", ":"];
  const text = functionCode.split(' ');
  let cantUniqueOperators = 0;
  let cantTotalOperators = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i].split('//').length > 1) { comments++; continue; }

    if (text.indexOf(operators[i]) != -1)
      cantUniqueOperators++;

    cantTotalOperators += functionCode.split(operators[i]).length - 1;
  }

  return { cantUniqueOperators, cantTotalOperators };
}

function getOperands(functionCode) {
  const operators = ["public", "static", "void", "&&", "||", "<=", ">=", "<", ">", "!=", "!", "+", "-", "/", "*", "int", "double", "float", ";", ":"];
  const text = functionCode.split(' ');
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

function getFanIn(fnName) {
  const fnNameOcurrences = [...inputCode.matchAll(fnName+PARTIAL_FUNCTION_CALL_REGEX.source)]

  return fnNameOcurrences.length-1
}

function getFanOut(fnBody) {
  let fanOut = 0

  functionsListRegex.forEach((fnRegex) => {
    const ocurrences = [...fnBody.matchAll(fnRegex)]
    fanOut += ocurrences.length
  })

  return fanOut
}

function generateHtml({fnSign, totalLines, codeLines, complex, fanIn, fanOut, blanks, comments, percentOfComments, halsteadLength, halsteadVolume}) {
  let html =
    `
    <div class="result">
      <h4><strong>${fnSign}</strong></h4>
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
    html += `<h4 class="text-warning">El porcentaje de comentarios debería ser mayor a 10%.</h4>`;
  }

  if (complex > 10) {
    html += `<h4 class="text-warning">La complejidad ciclomática no debería ser mayor a 10.</h4>`;
  }

  html += `</div>`

  return html;
}

function functionAnalizer(code) {
  posibleFnMatchArray = [...code.matchAll(JAVA_METHOD_SIGN_REGEX)]

  posibleFnMatchArray.filter(skipNoFunction).map(loadFunctionListRegex).forEach(([fnSignWithOpenToken, fnSign, _, fnName]) => {
    const fnBody = cropFunctionBody(code, fnSignWithOpenToken)
    const analisis = analizeCode(fnBody);
    const info = getInfo({fnSign, fnName, functionCode: fnBody, ...analisis})
    const infoHTML = generateHtml(info)
    appendInfoHTML(infoHTML)
  })
}

function loadFunctionListRegex(fnMatch) {
  const fnName = fnMatch[3]

  functionsListRegex.push(new RegExp(fnName+PARTIAL_FUNCTION_CALL_REGEX.source, "gm"))

  return fnMatch
}

function skipNoFunction([fnSignWithOpenToken]) {
  return !fnSignWithOpenToken.includes('if(') 
  && !fnSignWithOpenToken.includes('if (')
  && !fnSignWithOpenToken.includes('while(')
  && !fnSignWithOpenToken.includes('while (')
  && !fnSignWithOpenToken.includes('for(')
  && !fnSignWithOpenToken.includes('for (')
  && !fnSignWithOpenToken.includes("switch(")
  && !fnSignWithOpenToken.includes("switch (")
}

function cropFunctionBody(code, fnSignWithOpenToken) {
  const codeFromFnDeclaration = code.split(fnSignWithOpenToken)[1].trim()
    let openTokenIdx = 0
    let closeTokenIdx = 0

    while(openTokenIdx != -1 && closeTokenIdx != -1 && closeTokenIdx >= openTokenIdx) {
      openTokenIdx = codeFromFnDeclaration.indexOf("{", openTokenIdx+1)
      closeTokenIdx = codeFromFnDeclaration.indexOf("}", closeTokenIdx+1)
    }

    return codeFromFnDeclaration.slice(0, closeTokenIdx)
}