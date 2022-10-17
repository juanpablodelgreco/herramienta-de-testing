function getFanIn(inputCode, fnName) {
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

function getHalsteadLength(cantUniqueOperators, cantUniqueOperands) {
  return parseInt(cantUniqueOperators * Math.log2(cantUniqueOperators) + cantUniqueOperands * Math.log2(cantUniqueOperands));
}


function getHalsteadVolume(uniqueOperands, cantUniqueOperands, cantTotalOperators, cantTotalOperands) {
  return parseFloat((cantTotalOperators + cantTotalOperands) * Math.log2(uniqueOperands + cantUniqueOperands)).toFixed(2);
}

function calculateComplexity(functionCode) {
  const conditionsArray = [...functionCode.matchAll(PREDICATOR_REGEX)]
  let predicatorCount = 0

  conditionsArray.forEach(([condition]) => {
    if(!condition.includes("&&") && !condition.includes("||"))
      predicatorCount++
    else {
      if(condition.includes("||"))
        predicatorCount += condition.split("||").length
      if(condition.includes("&&"))
        predicatorCount += condition.split("&&").length
    }
  })

  return predicatorCount+1 || 1
}