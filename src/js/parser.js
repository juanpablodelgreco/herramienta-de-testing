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

function getOperators(functionCode) {
  const textWithoutComments = functionCode.replace(/(\/\*([\s\S]*?)\*\/)|(\/\/(.*)$)/gm, '');
  let cantUniqueOperators = 0;
  let cantTotalOperators = 0;
  for (let i = 0; i < OPERATORS.length; i++) {
    
    if (textWithoutComments.indexOf(OPERATORS[i]) != -1)
      cantUniqueOperators++;

    cantTotalOperators += functionCode.split(OPERATORS[i]).length - 1;
  }

  return { cantUniqueOperators, cantTotalOperators };
}

function analizeCode(functionCode) {
  let complex = 0;
  let blanks = 0;
  let comments = 0;
  const text = functionCode.toLowerCase().split('\n');
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

function getOperands(functionCode) {
  const uniqueOperands = [];
  const textWithoutComments = (functionCode.replace(/(\/\*([\s\S]*?)\*\/)|(\/\/(.*)$)/gm, '')).split(' ');
  let cantUniqueOperands = 0;
  let cantTotalOperands = 0;
  for (let i = 0; i < textWithoutComments.length; i++) {

    if (OPERATORS.indexOf(textWithoutComments[i]) == -1 && uniqueOperands.indexOf(textWithoutComments[i]) == -1) {
      uniqueOperands.push(textWithoutComments[i]);
      cantUniqueOperands++;
    }

    if (OPERATORS.indexOf(textWithoutComments[i]) == -1)
      cantTotalOperands++;
  }

  return { cantUniqueOperands, cantTotalOperands };
}