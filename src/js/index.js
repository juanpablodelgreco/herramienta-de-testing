const JAVA_METHOD_SIGN_REGEX = /^((public|private|protected|static|final|native|synchronized|abstract|threadsafe|transient|\s)+\s*?\w+?(<\s*\w+\s*>)?\s+?(\w+?)\s*?\([^)]*\)[\w\s,]*?)\{?\s*?$/gm;
const PREDICATOR_REGEX = /((while|if)\s*\(.*\)|case *\w:)/gm
const PARTIAL_FUNCTION_CALL_REGEX = /\s*\(/gm

let inputCode
let functionsListRegex

function clearCode() {
  document.getElementById("input-code").value = ""
}

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
      <h4><strong>${fnSign.replaceAll("<", "&#60").replaceAll(">", "&#62")}</strong></h4>
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

  addResultsTitle()

  posibleFnMatchArray.filter(skipNoFunction).map(loadFunctionListRegex).forEach(([fnSignWithOpenToken, fnSign, _, __, fnName]) => {    
    console.log({ fnSign })
    const fnBody = cropFunctionBody(code, fnSignWithOpenToken)
    const analisis = analizeCode(fnBody);
    const info = getInfo({fnSign, fnName, functionCode: fnBody, ...analisis})
    const infoHTML = generateHtml(info)
    appendInfoHTML(infoHTML)
  })
}

function addResultsTitle() {
  setInfoHTML("<h1>Resultados</h1>")
}

function loadFunctionListRegex(fnMatch) {
  const fnName = fnMatch[4]

  console.log({ fnName })

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

const EXAMPLE_CODE = 
`import java.io.*;
import java.util.*;

public class Main {

    public static Scanner teclado = new Scanner(System.in);
    public static PrintStream out = System.out;

    public static void pausar(String mensage) {
        out.print(mensage + "\nPresione <ENTER> para continuar . . . ");
        teclado.nextLine();
        out.println();
    }

    public static String leer_cadena(String mensaje) {
        out.print(mensaje + ": ");
        return teclado.nextLine();
    }

    public static int leer_entero(String mensaje) {
        try {
            return Integer.parseInt(leer_cadena(mensaje));
        } catch (NumberFormatException e) {
            out.print("N\u00FAmero incorrecto.");
            return leer_entero(mensaje);
        }
    }

    public static String ruta = "libros.tsv";

    public static void main(String[] args) {

        Funcion<Libro> imprimir = new Funcion<Libro>() {
            @Override
            public void funcion(Libro libro, Object parametros) {
                out.println(libro);
                int[] contador = (int[]) parametros;
                contador[0]++;
            }
        };
        Funcion<Libro> imprimirEnArchivo = new Funcion<Libro>() {
            @Override
            public void funcion(Libro libro, Object parametros) {
                PrintStream archivo = (PrintStream) parametros;
                archivo.print(libro.getISBN() + "\t");
                archivo.print(libro.getTitulo() + "\t");
                archivo.print(libro.getAutor() + "\t");
                archivo.print(libro.getEditorial() + "\t");
                archivo.print(libro.getEdicion() + "\t");
                archivo.print(libro.getAnno_de_publicacion() + "\n");
            }
        };
        if(!System.getProperties().get("os.name").equals("Linux") && System.console()!=null)
            try {
                out = new PrintStream(System.out, true, "CP850");
                teclado = new Scanner(System.in, "CP850");
            } catch (UnsupportedEncodingException e) {}
        Vector<Libro> vector = new Vector<Libro>();
        int i, n;
        Libro dato = null, libro;
        int[] contador = {0};
        int opcion, subopcion;
        String[] campos;
        try {
            Scanner entrada = new Scanner(new FileReader(ruta));
            while (entrada.hasNextLine()) {
                campos = entrada.nextLine().split("\t");
                libro = new Libro();
                libro.setISBN(campos[0]);
                libro.setTitulo(campos[1]);
                libro.setAutor(campos[2]);
                libro.setEditorial(campos[3]);
                libro.setEdicion(Integer.parseInt(campos[4]));
                libro.setAnno_de_publicacion(Integer.parseInt(campos[5]));
                vector.add(libro);
            }
            entrada.close();
        } catch (FileNotFoundException e) {}
        libro = new Libro();
        do {
            out.println("MEN\u00DA");
            out.println("1.- Altas");
            out.println("2.- Consultas");
            out.println("3.- Actualizaciones");
            out.println("4.- Bajas");
            out.println("5.- Ordenar registros");
            out.println("6.- Listar registros");
            out.println("7.- Salir");
            do {
                opcion = leer_entero ("Seleccione una opci\u00F3n");
                if(opcion<1 || opcion>7)
                    out.println("Opci\u00F3nn no v\u00E1lida.");
            } while (opcion<1 || opcion>7);
            out.println();
            if (vector.isEmpty() && opcion!=1 && opcion!=7) {
                pausar("No hay registros.\n");
                continue;
            }
            if (opcion<5) {
                libro.setISBN(leer_cadena ("Ingrese el ISBN del libro"));
                i = vector.indexOf(libro);
                dato = i<0 ? null : vector.get(i);
                if (dato!=null) {
                    out.println();
                    imprimir.funcion(dato, contador);
                }
            }
            if (opcion==1 && dato!=null)
                out.println("El registro ya existe.");
            else if (opcion>=2 && opcion<=4 && dato==null)
                out.println("\nRegistro no encontrado.");
            else switch (opcion) {
            case 1:
                libro.setTitulo(leer_cadena ("Ingrese el titulo"));
                libro.setAutor(leer_cadena ("Ingrese el autor"));
                libro.setEditorial(leer_cadena ("Ingrese el editorial"));
                libro.setEdicion(leer_entero ("Ingrese el edicion"));
                libro.setAnno_de_publicacion(leer_entero ("Ingrese el anno de publicacion"));
                vector.add(libro);
                libro = new Libro();
                out.println("\nRegistro agregado correctamente.");
                break;
            case 3:
                out.println("Men\u00FA de modificaci\u00F3n de campos");
                out.println("1.- titulo");
                out.println("2.- autor");
                out.println("3.- editorial");
                out.println("4.- edicion");
                out.println("5.- anno de publicacion");
                do {
                    subopcion = leer_entero ("Seleccione un n\u00FAmero de campo a modificar");
                    if (subopcion<1 || subopcion>5)
                        out.println("Opci\u00F3n no v\u00E1lida.");
                } while (subopcion<1 || subopcion>5);
                switch (subopcion) {
                    case 1:
                        dato.setTitulo(leer_cadena ("Ingrese el nuevo titulo"));
                        break;
                    case 2:
                        dato.setAutor(leer_cadena ("Ingrese el nuevo autor"));
                        break;
                    case 3:
                        dato.setEditorial(leer_cadena ("Ingrese el nuevo editorial"));
                        break;
                    case 4:
                        dato.setEdicion(leer_entero ("Ingrese el nuevo edicion"));
                        break;
                    case 5:
                        dato.setAnno_de_publicacion(leer_entero ("Ingrese el nuevo anno de publicacion"));
                        break;
                }
                out.println("\nRegistro actualizado correctamente.");
                break;
            case 4:
                vector.remove(dato);
                out.println("Registro borrado correctamente.");
                break;
            case 5:
                Collections.sort(vector);
                out.println("Registros ordenados correctamente.");
                break;
            case 6:
                n = vector.size();
                contador[0] = 0;
                for (i=0; i<n; i++)
                    imprimir.funcion(vector.get(i), contador);
                out.println("Total de registros: " + contador[0] + ".");
                break;
            }
            if (opcion<7 && opcion>=1)
                pausar("");
        } while (opcion!=7);
        try {
            PrintStream salida = new PrintStream(ruta);
            n = vector.size();
            for (i=0; i<n; i++)
                imprimirEnArchivo.funcion(vector.get(i), salida);
            salida.close();
        } catch (FileNotFoundException e) {}
    }
}

interface Funcion<T extends Comparable<T>> {
    void funcion(T dato, Object parametros);
}

class Libro implements Comparable<Libro> {

    private String ISBN;
    private String titulo;
    private String autor;
    private String editorial;
    private int edicion;
    private int anno_de_publicacion;

    @Override
    public boolean equals(Object libro) {
        return this==libro || (libro instanceof Libro && ISBN.equals(((Libro)libro).ISBN));
    }

    @Override
    public int compareTo(Libro libro) {
        return ISBN.compareTo(libro.ISBN);
    }
    
    @Override
    public String toString() {
        return
            "ISBN               : " + ISBN + "\n" +
            "titulo             : " + titulo + "\n" +
            "autor              : " + autor + "\n" +
            "editorial          : " + editorial + "\n" +
            "edicion            : " + edicion + "\n" +
            "anno de publicacion: " + anno_de_publicacion + "\n";
    }

    public String getISBN() {
        return ISBN;
    }
    
    public void setISBN(String ISBN) {
        this.ISBN = ISBN;
    }

    public String getTitulo() {
        return titulo;
    }
    
    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getAutor() {
        return autor;
    }
    
    public void setAutor(String autor) {
        this.autor = autor;
    }

    public String getEditorial() {
        return editorial;
    }
    
    public void setEditorial(String editorial) {
        this.editorial = editorial;
    }

    public int getEdicion() {
        return edicion;
    }
    
    public void setEdicion(int edicion) {
        this.edicion = edicion;
    }

    public int getAnno_de_publicacion() {
        return anno_de_publicacion;
    }
    
    public void setAnno_de_publicacion(int anno_de_publicacion) {
        this.anno_de_publicacion = anno_de_publicacion;
    }
}
`
document.getElementById("input-code").value = EXAMPLE_CODE
