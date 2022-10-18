let inputCode
let functionsListRegex

function showMetrics() {
  inputCode = getInputCode()
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

function functionAnalizer(code) {
  posibleFnMatchArray = [...code.matchAll(JAVA_METHOD_SIGN_REGEX)]

  addResultsTitle()

  posibleFnMatchArray.filter(skipNoFunction).map(loadFunctionListRegex).forEach(([fnSignWithOpenToken, fnSign, _, __, fnName]) => {
    const fnBody = cropFunctionBody(code, fnSignWithOpenToken)
    const analisis = analizeCode(fnBody);
    const info = getInfo({fnSign, fnName, functionCode: fnBody, ...analisis})
    const infoHTML = generateHtml(info)
    appendInfoHTML(infoHTML)
  })
}

function loadFunctionListRegex(fnMatch) {
  const fnName = fnMatch[4]

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

function getInfo({ fnSign, fnName, functionCode, complex, blanks, comments, totalLines }) {
  const codeLines = parseInt(totalLines - comments - blanks);
  const percentOfComments = (parseFloat((parseInt(comments) / parseInt(totalLines)) * 100).toFixed(2)) + "%";
  if (!isNaN(percentOfComments)) percentOfComments = 0 + "%";

  const { cantUniqueOperators, cantTotalOperators } = getOperators(functionCode);
  const { cantUniqueOperands, cantTotalOperands } = getOperands(functionCode);
  const halsteadLength = getHalsteadLength(cantUniqueOperators, cantUniqueOperands);
  const halsteadVolume = getHalsteadVolume(cantUniqueOperators, cantUniqueOperands, cantTotalOperators, cantTotalOperands);
  const fanIn = getFanIn(inputCode, fnName)
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