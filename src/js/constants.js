const JAVA_METHOD_SIGN_REGEX = /^((public|private|protected|static|final|native|synchronized|abstract|threadsafe|transient|\s)+\s*?\w+?(<\s*\w+\s*>)?\s+?(\w+?)\s*?\([^)]*\)[\w\s,]*?)\{?\s*?$/gm;
const PREDICATOR_REGEX = /((while|if)\s*\(.*\)|case *\w:)/gm
const PARTIAL_FUNCTION_CALL_REGEX = /\s*\(/gm

const INPUT_CODE_ID = "input-code"
const RESULT_CONTAINER_ID = "result_container"

const OPERATORS = ["+", "-", "/", "*", "int", "double", "float", ";", ":", "public", "static", "void", "&&", "||", "<=", ">=", "<", ">"]