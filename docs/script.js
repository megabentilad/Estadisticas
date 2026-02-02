$(document).ready(function() {
    const autocolors = window['chartjs-plugin-autocolors'];
    const baseDate = new Date();
    const baseYesterdayDate = new Date(baseDate);
    baseYesterdayDate.setDate(baseDate.getDate() - 1)
    //const currentDate = baseDate.getFullYear() + '-' + ('0' + (baseDate.getMonth() + 1)).slice(-2) + '-' + ('0' + baseDate.getDate()).slice(-2);
    const yesterdayDate = baseYesterdayDate.getFullYear() + '-' + ('0' + (baseYesterdayDate.getMonth() + 1)).slice(-2) + '-' + ('0' + baseYesterdayDate.getDate()).slice(-2);
    const yesterdayWeekDay = getWeekDay(baseYesterdayDate);
    const tokenVer1 = 'github_pat_11ANGJOYQ0KYo7NStzY7fS_Sq8gFZTuM9u';
    const tokenVer2 = 'jfIj6mcVK0YCXZ6p6cjI1QCjHay5b1rcUWHKTAE34QQPhmik';
    const tokenVer = tokenVer1 + tokenVer2;
    var tokenEditar = ""
    if (GetURLParameter('token') != "") {
        tokenEditar = GetURLParameter('token');
    }else{
        tokenEditar = prompt("Ingresa el token de git para poder editar:");
    }
    const owner = 'megabentilad';
    const repo = 'Estadisticas';
    const filePath = 'docs/base.csv';

    const testing = false;

    let csvContent = [];

    // Cargar el archivo CSV completo al inicio
    console.log("Trigesimo - 1");
    if (testing){
        console.log("MODO TESTING ACTIVADO");
    }
    inicio();
    
    function inicio(){
        if ((tokenEditar == null) || (tokenEditar == "")) {
            loadCSVContent(tokenVer);
        }else{
            loadCSVContent(tokenEditar);
        }
    }

    function loadCSVContent(token) {
        // Lee el fichero en local si está en modo testing
        if (testing){
            // En una terminal en la carpeta
            // python -m http.server 8000
            $.ajax({
                url: "http://localhost:8000/base.csv",
                async: false,
                success: function(rawContent) {
                    csvContent = parseCSV(rawContent);
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    // Handle error here
                    console.error("Error occurred:", textStatus, errorThrown);
                }
            });

        }else{
            const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
            $.ajax({
                url: url,
                async: false,
                headers: {
                    'Authorization': `token ${token}`
                },
                success: function(response) {
                    const content = atob(response.content);
                    // Cambiar símbolos por tildes y eñes (Tildes mayúsculas y ñ mayúscula no tienen formato)
                    // TODO Esta solución destruye los datos
                    //const content = rawContent.replace("Ã¡", "á").replace("Ã©", "é").replace("Ã³", "ó").replace("Ãº", "ú").replace("Ã±", "ñ").replace("Ã", "í")
                    csvContent = parseCSV(content);
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    // Handle error here
                    console.error("Error occurred:", textStatus, errorThrown);
                    if (tokenEditar !== null) {
                        alert("No se ha podido obtener datos del repositorio.\nProbando de nuevo con el token de visualización.");
                        loadCSVContent(tokenVer);
                    }else{
                        alert("Un problema de red evita que la página funcione. Espere unos minutos antes de intentarlo de nuevo.");
                    }

                }
            });
        }
        // Cargar las fechas disponibles para modificar reportes
        loadAvailableDates();

        //Mostrar los datos en consola
        //console.log("Contenido del fichero CSV:");
        //console.log(content);
        //console.log("Contenido del array:");
        //console.log(csvContent);
        
        //Mirar si el reporte del día ya ha sido creado y desactivar el botón si es el caso
        if (csvContent.find(entry => entry.fecha === yesterdayDate)){
            $('#create-report').html("Ya existe un reporte para ayer " + yesterdayWeekDay + " " + yesterdayDate);
            $('#create-report').prop("disabled",true);
            $('#create-report').css("background-color", "#e6834a").css("cursor", "not-allowed");
        }else{
            $('#create-report').html("Rellenar el reporte de ayer " + yesterdayWeekDay + " " + yesterdayDate);
        }

        // Si no hay token para editar, ocultar las opciones de edición
        if ((tokenEditar == null) || (tokenEditar == "")) {
            $('#create-report').hide();
            $('#modify-report').hide();
        }

        // Comprobar que los datos son correctos y mostrar alertas en la consola
        qualityCheck();

        // Rellenar la tabla de datos en bruto
        manageRawDatatTable();

        // Analizar datos y mostrar medias
        createBasicMedias();

        // Analizar datos y mostrar gráficas
        createGraphics();

                    

                
        
    }


    //Comprobar el estado de los datos
    function qualityCheck(){
        // Comprobar si falta algún día
        const missingDates = [];
        for (let i = 1; i < csvContent.length; i++) {
            const prevDate = new Date(csvContent[i - 1].fecha);
            const currentDate = new Date(csvContent[i].fecha);

            // Calculate the difference in days
            const diffInDays = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24));

            if (diffInDays > 1) {
                for (let j = 1; j < diffInDays; j++) {
                    const missingDate = new Date(prevDate);
                    missingDate.setDate(prevDate.getDate() + j + 1);
                    missingDates.push(missingDate.toISOString().split("T")[0]); // Format as YYYY-MM-DD
                }
            }
        }
        if (missingDates.length > 0) {
            console.warn("Faltan fechas en el reporte!!: ", missingDates);
        } else {
            console.log("No falta ninguna fecha en el reporte. Good job!!");
        }


    }

    // Analiza los datos y crea gráficas usando Charts.js
    function createGraphics(){
        var xValues = [];
        var yValues = [];
        
        
        
        // Chart con los temas de las pajas
        var pajasObject = {};
        var pajaTemas = {};
        for (let i = 0; i < csvContent.length; i++) {
            
            pajasObject[csvContent[i].fecha] = [];
            var pajasDelDia = []
            csvContent[i].pajas.split("),").forEach(paj => {
                var pajlist = [];
                paj = paj.replace("(","").replace(")","");
                paj.split(",").forEach(pajelem => {
                    pajlist.push(pajelem.trim());
                });
                pajasDelDia.push(pajlist);

            });
            pajasObject[csvContent[i].fecha].push(pajasDelDia);
        };
        var allThemesRepeated = [];
        for (const [key, value] of Object.entries(pajasObject)) {
            var counts = {};
            value.forEach(item => {
                item.forEach(item2 => {
                    if (typeof item2[3] !== 'undefined'){
                        // Normalizar tipos
                        var theme = item2[3].replace("lolicon", "loli").replace("shotacon", "shota").replace("zapping","ruido").replace("yuri","lesbianas").replace("yaoi", "gay").replace("bondage","bdsm").replace("homemade","casero").replace("crossdress","crossdressing").replace("cuck","NTR").replace("sumision","bdsm").replace("exterior","public").replace("cotidiano","vainilla").replace("cute","vainilla").replace("ntr", "NTR");

                        allThemesRepeated.push(theme);
                    }
                    //else{
                    //    console.log(key + " Tiene paja undefined");
                    //}
                });
              });

            // Creating the result lists
            
            //console.log("xValues: " + xValues);
            //console.log("yValues: " + yValues);
        }
        //console.log(allThemesRepeated);
        allThemesRepeated.forEach(function (x) { 
            pajaTemas[x] = (pajaTemas[x] || 0) + 1;
        });
        
        const sortedEntries = Object.entries(pajaTemas).sort(([, a], [, b]) => b - a);
        pajaTemas = Object.fromEntries(sortedEntries);

        var otrosTemas = 0;
        for (const [key, value] of Object.entries(pajaTemas)) {
            if (value > 1){
                xValues.push(key);
                yValues.push(value);
            }else{
                //console.log("paja unica: " + key);
                otrosTemas ++;
            }
            
        }
        xValues.push("Otros");
        yValues.push(otrosTemas);

        //console.log(pajasObject);
        new Chart("chartPajasTheme", {
            type: "pie",
            data: {
              labels: xValues,
              datasets: [{
                data: yValues
              }]
            },
            options: {
                plugins: {
                    autocolors,
                    legend: {
                        display: false
                    }
                },
                title: {
                    display: false,
                    text: "Principales temas para pajas"
                }
            }
        });

        $("#chartPajasTemasInfo").append(`
            <p>Esta gráfica trata de representar la temática <b>principal</b> de cada sesión</p>
            <p><b>Otros:</b> Temáticas que solo se han utilizado una vez</p>
            <p><b>Ruido:</b> Sesiones in una temática en concreto, doomscrolling o saltando de un lado al otro en mi mente</p>
        `);


        // Chart con las pajas semanales
        var semanaAnterior = getWeekNumber(new Date(csvContent[0].fecha));
        var marcadorSemana = [];
        var diasCadaSemana = [];
        var primerDiaSemana = csvContent[0].fecha;
        var ultimoDiaSemana = "";
        var diasSinPaja = 0;
        var cortasSemana = 0;
        var normalesSemana = 0;
        var largasSemana = 0;
        var listaNumeroCortas = [];
        var listaNumeroNormales = [];
        var listaNumeroLargas = [];
        var listaTotalSemana = [];

        for (let i = 1; i < csvContent.length; i++) {
            if (primerDiaSemana == ""){
                primerDiaSemana = csvContent[i].fecha;
            }
            var semanaActual = getWeekNumber(new Date(csvContent[i].fecha));
            var cortasHoy = 0;
            var normalesHoy = 0;
            var largasHoy = 0;
            csvContent[i].pajas.split("),").forEach(paj => {
                if (paj == ""){
                    ++diasSinPaja;
                }
                paj = paj.replace("(","").replace(")","");
                const elements = paj.split(",").map(x => x.trim());
                const tipo = elements[1]; 
                if (tipo == "corta"){
                    ++cortasHoy;
                }
                if (tipo == "normal"){
                    ++normalesHoy;
                }
                if (tipo == "larga"){
                    ++largasHoy;
                }

            });
            if (semanaActual == semanaAnterior){
                cortasSemana += cortasHoy;
                normalesSemana += normalesHoy;
                largasSemana += largasHoy;
            }else{
                listaNumeroCortas.push(cortasSemana);
                listaNumeroNormales.push(normalesSemana);
                listaNumeroLargas.push(largasSemana);
                listaTotalSemana.push(cortasSemana + normalesSemana + largasSemana);
                marcadorSemana.push(semanaAnterior);
                semanaAnterior = semanaActual;
                cortasSemana = 0;
                normalesSemana = 0;
                largasSemana = 0;

                ultimoDiaSemana = csvContent[i].fecha;
                diasCadaSemana.push(primerDiaSemana + " -> " + ultimoDiaSemana)
                primerDiaSemana = "";

            }
        };

        new Chart("chartPajasSemanales", {
            type: "bar",
            data: {
                labels: marcadorSemana,
                datasets: [
                {
                    label: 'Corta',
                    data: listaNumeroCortas,
                    backgroundColor: 'rgba(54, 162, 235, 0.7)'
                },
                {
                    label: 'Normal',
                    data: listaNumeroNormales,
                    backgroundColor: 'rgba(255, 99, 132, 0.7)'
                },
                {
                    label: 'Larga',
                    data: listaNumeroLargas,
                    backgroundColor: 'rgba(255, 206, 86, 0.7)'
                }
                ]
            },
            options: {
                plugins: {
                    autocolors,
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                          title: function (context) {
                            var diasEstaSemana = diasCadaSemana[parseInt(context[0].label, 10) - 2];
                            var totalSemana = listaTotalSemana[parseInt(context[0].label, 10) - 2]
                            return `${totalSemana}\nSemana Nº${context[0].label} del año\n${diasEstaSemana}`;
                          }
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                    },
                    y: {
                        stacked: true
                    }
                },
                title: {
                    display: false,
                    text: "Pajas semanales"
                }
            }
        });

        var totalAnual = 0;
        
        for (let i = 0; i < csvContent.length; i++) {
            totalAnual += csvContent[i].pajas.split("),").length;
        }
        var mediaSemanal = totalAnual / marcadorSemana.length;
        var mediaDiaria = totalAnual / csvContent.length;
        var mediaDiariaSelectiva = totalAnual / (csvContent.length - diasSinPaja);

        $("#chartPajasSemanalesInfo").append(`
            <p><b>Media semanal:</b> ${Math.round(mediaSemanal * 100) / 100}</p>
            <p><b>Media diaria:</b> ${Math.round(mediaDiaria * 100) / 100}</p>
            <p><b>Media diaria (sin contar días de 0):</b> ${Math.round(mediaDiariaSelectiva * 100) / 100}</p>
        `);

        // Chart con las horas de sueño diarias
        xValues = [];
        yValues = [];

        for (let i = 1; i < csvContent.length; i++) {
            xValues.push(csvContent[i].fecha);
            yValues.push(getTimeDifference(csvContent[i-1].dormir, csvContent[i].despertar));

        };

        const finDeSemanaSegmento = (ctx) => checkIfWeekendSegment(ctx.chart.data.labels[ctx.p0DataIndex]);
        const finDeSemanaDia = (ctx) => checkIfWeekend(ctx.chart.data.labels[ctx.p0DataIndex]);
        const vacaciones = ["2025-03-03","2025-03-04","2025-08-22","2025-09-17","2025-09-18","2025-09-19","2025-09-22","2025-09-23"];
        const festivos = ["2025-04-17","2025-04-18","2025-04-23","2025-05-01","2025-06-24","2025-08-15","2025-10-06","2025-10-13","2025-11-01","2025-12-06","2025-12-08","2025-12-24","2025-12-25","2025-12-31"];
        var segmentColor = '';

        new Chart("chartHorasSueñoDiarias", {
            type: "line",
            data: {
              labels: xValues,
              datasets: [{
                data: yValues,
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1,
                pointRadius: 4,
                segment: {
                    borderColor: ctx => {
                        let finalSegmentColor = 'rgb(75, 192, 192)';
                        let currentDate, nextDayDate = new Date(ctx.chart.data.labels[ctx.p0DataIndex])
                        nextDayDate.setDate(nextDayDate.getDate() + 1)
                        if (finDeSemanaSegmento(ctx)) {
                            finalSegmentColor = 'rgb(192,75,75)'; 
                        }
                        if (vacaciones.includes(nextDayDate.toISOString().split('T')[0])){
                            finalSegmentColor = 'rgb(245, 0, 233)';
                        }
                        if (festivos.includes(nextDayDate.toISOString().split('T')[0])){
                            finalSegmentColor = 'rgb(0, 230, 11)';
                        }
                        return finalSegmentColor;
                    },
                    pointColor: ctx => {
                        let finalSegmentColor = 'rgb(75, 192, 192)';
                        if (finDeSemanaDia(ctx)) {
                            finalSegmentColor = 'rgb(192,75,75)'; 
                        }
                        if (vacaciones.includes(ctx.chart.data.labels[ctx.p0DataIndex])){
                            finalSegmentColor = 'rgb(245, 0, 233)';
                        }
                        if (festivos.includes(ctx.chart.data.labels[ctx.p0DataIndex])){
                            finalSegmentColor = 'rgb(0, 230, 11)';
                        }
                        return finalSegmentColor;
                    }
                }
              }]
            },
            options: {
                plugins: {
                    autocolors,
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                          label: function (context) {
                            const value = context.raw;
                            const hours = Math.trunc(context.raw);
                            const minutes = Math.trunc((context.raw - Math.trunc(context.raw)) * 60);
                            let otros = "Día de semana"
                            if (checkIfWeekend(new Date(context.label))){
                                otros = 'Fin de semana'
                            }
                            if (vacaciones.includes(context.label)){
                                otros = 'Vacaciones'
                            }
                            if (festivos.includes(context.label)){
                                otros = "Festivo"
                            }
                            return [otros, Math.trunc(value*100)/100 + " horas -> " + hours + ":" + minutes];
                          },
                          title: function (context) {
                            const dia = getWeekDay(context[0].label);
                            return `${dia} ${context[0].label}`;
                          }
                        }
                    },
                    zoom: {
                        zoom: {
                            wheel: {
                                enabled: true,
                            },
                            pinch: {
                                enabled: true
                            },
                            mode: 'x'
                        },
                        pan: {
                            enabled: true,
                            mode: 'x'
                        }
                    }
                },
                title: {
                    display: false,
                    text: "Horas de sueño diarias"
                },
            }
        });

        var totalDormidoSemana = 0;
        var totalDormidoFinDeSemana = 0;

        var diasSemana = 0;
        var diasFinde = 0;

        for (let i = 1; i < csvContent.length; i++) {
            if (checkIfWeekend(csvContent[i].fecha)) {
                totalDormidoFinDeSemana += getTimeDifference(csvContent[i-1].dormir, csvContent[i].despertar);
                diasFinde ++;
                //console.log(getTimeDifference(csvContent[i-1].dormir, csvContent[i].despertar))
            }else{
                totalDormidoSemana += getTimeDifference(csvContent[i-1].dormir, csvContent[i].despertar);
                diasSemana ++;
            }
        };
        
        var mediaSemanaHoras = Math.trunc(totalDormidoSemana/diasSemana);
        var mediaSemanaMinutos = Math.trunc(((totalDormidoSemana/diasSemana) - mediaSemanaHoras) * 60);
        var mediaFindeHoras = Math.trunc(totalDormidoFinDeSemana/diasFinde);
        var mediaFineMinutos = Math.trunc(((totalDormidoFinDeSemana/diasFinde) - mediaFindeHoras) * 60);
        var mediaTotalHoras = Math.trunc((totalDormidoSemana+totalDormidoFinDeSemana)/(diasSemana + diasFinde));
        var mediaTotalMinutos = Math.trunc((((totalDormidoSemana+totalDormidoFinDeSemana)/(diasSemana + diasFinde)) - mediaSemanaHoras) * 60);

        $("#chartHorasSueñoDiariasExtra").append(`
            <p><b>Media sueño semana: </b>${mediaSemanaHoras}:${mediaSemanaMinutos.toString().padStart(2, '0')}</p>
            <p><b>Media sueño fin de semana: </b>${mediaFindeHoras}:${mediaFineMinutos.toString().padStart(2, '0')}</p>
            <p><b>Media sueño: </b>${mediaTotalHoras}:${mediaTotalMinutos.toString().padStart(2, '0')}</p>
        `);

        // Chart con las horas de sueño semanales
        xValues = [];
        yValues = [];
        var horasSueñoSemana = 0;
        var semanaAnterior = getWeekNumber(new Date(csvContent[1].fecha))

        for (let i = 1; i < csvContent.length; i++) {
            var semanaActual = getWeekNumber(new Date(csvContent[i].fecha))
            var horasDormidasHoy = getTimeDifference(csvContent[i-1].dormir, csvContent[i].despertar)
            if (semanaActual == semanaAnterior){
                horasSueñoSemana += horasDormidasHoy;
            }else{
                yValues.push(horasSueñoSemana);
                xValues.push(semanaAnterior);
                semanaAnterior = semanaActual;
                horasSueñoSemana = 0;

            }
        };

        new Chart("chartHorasSueñoSemanales", {
            type: "line",
            data: {
              labels: xValues,
              datasets: [{
                data: yValues,
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1,
                pointRadius: 4
              }]
            },
            options: {
                plugins: {
                    autocolors,
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                          label: function (context) {
                            const value = context.raw;
                            const hours = Math.trunc(context.raw);
                            const minutes = Math.trunc((context.raw - Math.trunc(context.raw)) * 60);
                            return [Math.trunc(value*100)/100 + " horas -> " + hours + ":" + minutes];
                          },
                          title: function (context) {
                            return `Semana Nº${context[0].label} del año`;
                          }
                        }
                    }
                },
                title: {
                    display: false,
                    text: "Horas de sueño semanales"
                },
            }
        });

        var totalDormidoSemana = 0;
        var totalDormidoFinDeSemana = 0;

        var diasSemana = 0;
        var diasFinde = 0;

        for (let i = 1; i < csvContent.length; i++) {
            if (checkIfWeekend(csvContent[i].fecha)) {
                totalDormidoFinDeSemana += getTimeDifference(csvContent[i-1].dormir, csvContent[i].despertar);
                diasFinde ++;
                //console.log(getTimeDifference(csvContent[i-1].dormir, csvContent[i].despertar))
            }else{
                totalDormidoSemana += getTimeDifference(csvContent[i-1].dormir, csvContent[i].despertar);
                diasSemana ++;
            }
        };
        

        $("#chartHorasSueñoSemanalesExtra").append(`
            <p></p>
        `);
        
        // Chart alimentacion
        var mealsObject = {};
        var daysLacteo = 0;
        var daysCereal = 0;
        var daysCarne = 0;
        var daysVerdura = 0;
        var daysFruta = 0;



        for (let i = 0; i < csvContent.length; i++) {
            

            mealsObject[csvContent[i].fecha] = "";
            var dailyMeals = ""
            csvContent[i].comida.split(",").forEach(meal => {
                // Categorizar las comidas y guardarlas en el objeto
                meal = meal.trim().replace("leche", "lacteo").replace("cereales", "cereal").replace("galletas", "cereal").replace("bizcocho", "cereal, lacteo, carne").replace("patatas", "cereal").replace("lentejas", "cereal").replace("conguitos", "cereal, lacteo").replace("manzana", "fruta").replace("yatekomo", "cereal").replace("queso", "lacteo").replace("pollo", "carne").replace("ambrosia", "cereal, lacteo").replace("pizza", "cereal, lacteo").replace("arroz", "cereal").replace("hamburguesas", "carne").replace("pure de patata", "cereal, lacteo").replace("tortilla francesa", "carne").replace("carne", "carne").replace("flan", "lacteo").replace("tortitas", "lacteo, carne, cereal").replace("merluza", "carne").replace("huevo", "carne").replace("tortilla de patata", "carne, cereal").replace("sopa", "carne").replace("bocartes", "carne").replace("copa de chocolate", "lacteo").replace("salmon", "carne").replace("bocadillo de nocilla", "cereal, lacteo").replace("bocadillo de queso", "cereal, lacteo").replace("pasta", "cereal, lacteo").replace("bocadillo de chocolate", "cereal, lacteo").replace("salchichas", "carne").replace("hamburguesa", "carne").replace("pure", "verdura").replace("garbanzos", "cereal").replace("alubias", "cereal").replace("croquetas", "cereales, lacteo").replace("gofre", "cereal").replace("chocolatina", "lacteo").replace("mikado", "lacteo, cereal").replace("empanada", "cereal, lacteo, carne").replace("flash", "cereal").replace("lubina", "carne").replace("variado", "cereal").replace("palomitas", "cereal").replace("", "")
                meal = meal.replace("solomillo de cerdo", "carne").replace("natillas", "lacteo").replace("costilla", "carne").replace("rosquillas", "lacteo, cereal").replace("empanadillas", "carne, cereal").replace("lomo", "carne").replace("sandwich", "cereal, lacteo, carne").replace("secreto", "carne").replace("albondigas", "carne").replace("chocolate", "lacteo").replace("nocilla", "lacteo").replace("browny", "lacteo, cereal").replace("couscous", "cereal, carne").replace("tarta", "lacteo, cereal").replace("orejas", "cereal").replace("sardinas", "carne").replace("torrijas", "lacteo, cereal").replace("jamon", "carne").replace("rabas", "carne").replace("solomillo", "carne").replace("atun", "carne").replace("calamares", "carne").replace("marmitaco", "carne, cereal").replace("pajarita", "cereal, lacteo").replace("chuleta", "carne").replace("donetes", "lacteo, cereal").replace("filetes", "carne").replace("melon", "fruta").replace("yogur", "lacteo").replace("cuscus", "cereal, carne").replace("helado", "lacteo").replace("pastelitos", "lacteo, cereal").replace("crema", "verdura").replace("petisuis", "lacteo").replace("almendras", "cereal").replace("macedonia", "fruta").replace("batido", "lacteo").replace("corbata", "cereal").replace("ensaimada", "cereal").replace("vinagreta", "cereal").replace("kit kat", "lacteo, cereal").replace("bolleria", "lacteo, cereal").replace("pinchos morunos", "carne").replace("ojitos", "carne").replace("sanjacobo", "cereal, lacteo, carne").replace("lechuga", "verdura").replace("", "")
                meal = meal.replace("filloas", "cereal, lacteo").replace("nuggets", "cereal, carne").replace("filete empanado", "cereal, carne").replace("bonito", "carne").replace("castanas", "cereal").replace("regalices", "lacteo").replace("cacahuetes", "cereal").replace("mandarina", "fruta").replace("quesada", "lacteo").replace("frutos secos", "cereal").replace("kitkat", "cereal, lacteo").replace("polvoron", "lacteo, cereal").replace("oreo", "cereal").replace("panetone", "lacteo, cereal").replace("pavo", "carne").replace("turron", "lacteo, cereal").replace("napolitana", "cereal, lacteo").replace("batata", "cereal").replace("roscon", "lacteo, cereal").replace("durum", "carne, cereal, lacteo, verdura").replace("zumo", "fruta").replace("", "")
                if (!meal.includes("lacteo") && !meal.includes("carne") && !meal.includes("cereal") && !meal.includes("verdura") && !meal.includes("fruta")&& !meal.includes("")){
                    console.log("Este alimento del día " + csvContent[i].fecha + " está sin clasificar: " + meal);
                }
                dailyMeals = dailyMeals + ", " + meal + csvContent[i].fecha;

            });
            mealsObject[csvContent[i].fecha] = dailyMeals;
            if (dailyMeals.includes("lacteo")){
                daysLacteo ++;
            }
            if (dailyMeals.includes("cereal")){
                daysCereal ++;
            }
            if (dailyMeals.includes("carne")){
                daysCarne ++;
            }
            if (dailyMeals.includes("verdura")){
                daysVerdura ++;
            }
            if (dailyMeals.includes("fruta")){
                daysFruta ++;
            }
        };


        xValues = ["Lacteos", "Animal", "Cereales y tubérculos", "Verduras", "Frutas"];
        yValues = [(daysLacteo / csvContent.length * 100), (daysCarne / csvContent.length * 100), (daysCereal / csvContent.length * 100), (daysVerdura / csvContent.length * 100), (daysFruta / csvContent.length * 100)];

        new Chart("chartAlimentacion", {
            type: "bar",
            data: {
              labels: xValues,
              datasets: [{
                data: yValues
              }]
            },
            options: {
                plugins: {
                    autocolors,
                    legend: {
                        display: false
                    }
                },
                title: {
                    display: false,
                    text: "Tipo de alimentación"
                }
            }
        });

        $("#chartComidasInfo").append(`
            <p><b>Atención:</b> Esto es una media de qué tipo de alimentos he comido en los últimos ${csvContent.length} dias.</p>
            <p>Por ejemplo; Si a lo largo de 10 días, 5 he comido fruta, "Fruta" marcará un 50%</p>
        `);

    }

    // Gestionar las medias básicas
    function createBasicMedias(){
        //console.log("-- MEDIAS --");
        var vecesCagadoTotal = 0;
        var tiempoCagadoTotal = 0;
        var tiempoCagadoLimpiarTotal = 0;
        var vecesDuchaTotal = 0;
        var vecesAfeitarTotal = 0;
        var pesoTotal = 0;
        var vecesSentadillasTotal = 0;
        var vecesRingFitTotal = 0;
        var vecesCorrer = 0;
        var vecesPajasTotal = 0;

        for (let i = 0; i < csvContent.length; i++) {
            //console.log("- " + csvContent[i].fecha + " -");
            // Cagar
            //console.log("  Cagar");
            csvContent[i].cagar.split("),").forEach(line => {
                // 0 Hora
                // 1 Tiempo cagar
                // 2 Tiempo limpiar
                var subLine = line.replace("(","").replace(")","").split(",");
                vecesCagadoTotal ++;
                tiempoCagadoTotal += timeToSeconds(subLine[1]);
                tiempoCagadoLimpiarTotal += timeToSeconds(subLine[2]);
                //console.log(csvContent[i].fecha);
                //console.log("    tiempo cagando: " + subLine[1]);
                //console.log("    tiempo cagando total: " + tiempoCagadoTotal);
                //console.log("    tiempo limpiando: " + subLine[2]);
                //console.log("    tiempo limpiando total: " + tiempoCagadoLimpiarTotal);
            });

            // Duchas
            if (csvContent[i].ducha == "si"){
                vecesDuchaTotal ++;
            }

            // Afeitar
            if (csvContent[i].afeitar == "si"){
                vecesAfeitarTotal ++;
            }

            // Peso
            //console.log("  Peso");
            pesoTotal += parseFloat(csvContent[i].peso);
            //console.log("    peso: " + csvContent[i].peso);
            //console.log("    peso total: " + pesoTotal);

            // Ejercicio
            if (csvContent[i].ejercicio == "sentadillas"){
                vecesSentadillasTotal ++;
            }
            if (csvContent[i].ejercicio == "ring fit adventure"){
                vecesRingFitTotal ++;
            }
            if (csvContent[i].ejercicio == "correr"){
                vecesCorrer ++;
            }

            // Pajas
            vecesPajasTotal += csvContent[i].pajas.split("),").length;
        }

        // Vaciar la lista de medias
        $('#medias-div').empty();

        // Escribir la info en el div
        $
        const subsections = [
            { title: "Cagar", text: "Total de cagaciones = " + vecesCagadoTotal + "<br>Media de cagaciones al día = " + (vecesCagadoTotal / csvContent.length).toFixed(1) + "<br><br>Tiempo total cagando = " + secondsToTime(tiempoCagadoTotal) + "<br>Media tiempo cagando = " + secondsToTime((tiempoCagadoTotal / vecesCagadoTotal)) + "<br>Tiempo total limpiando = " + secondsToTime(tiempoCagadoLimpiarTotal) + "<br>Media tiempo limpiando = " + secondsToTime((tiempoCagadoLimpiarTotal / vecesCagadoTotal)) + "<br><br>Tiempo en el baño total = " + secondsToTime(tiempoCagadoLimpiarTotal + tiempoCagadoTotal) + "<br>Media de tiempo en el baño = " + secondsToTime(((tiempoCagadoTotal + tiempoCagadoLimpiarTotal) / vecesCagadoTotal)) },
            { title: "Aseo", text: "Total de duchas = " + vecesDuchaTotal + "<br>Media de duchas semanal = " + (vecesDuchaTotal / (csvContent.length / 7)).toFixed(1) + "<br><br>Total de afeitaciones = " + vecesAfeitarTotal + "<br>Media de afeitaciones semanal = " + (vecesAfeitarTotal / (csvContent.length / 7)).toFixed(1) },
            { title: "Peso", text: "Media de peso = " + (pesoTotal / csvContent.length).toFixed(1) },
            { title: "Ejercicio", text: "Total de dias sentadillas = " + vecesSentadillasTotal + "<br>Total dias ring fit = " + vecesRingFitTotal + "<br>Total dias correr = " + vecesCorrer + "<br><br>Media dias ejercicio a la semana = " + ((vecesSentadillasTotal + vecesRingFitTotal + vecesCorrer) / (csvContent.length / 7)).toFixed(1) },
            { title: "Pajas", text: "Total de pajas = " + vecesPajasTotal + "<br>Media de pajas al día = " + (vecesPajasTotal / csvContent.length).toFixed(1) },
        ];

        subsections.forEach(section => {
            $('#medias-div').append(`
                <div class="subsection">
                    <h3>${section.title}</h3>
                    <p>${section.text}</p>
                </div>
            `);
        });
    }


    // Gestionar la tabla de valores en bruto
    function manageRawDatatTable(){
        // Rellenar la tabla de datos en bruto
        const $table = $("#raw-data-table");

        // Vaciar la tabla
        $table.empty();

        // Incluir los headers en la tabla
        const titulos = ["Fecha", "Despertar", "Comida", "Cagar", "Ducha", "Afeitar", "Peso", "Ejercicio", "Pajas", "Dormir", "Mood", "Fatiga", "Otros"];
        const headerRow = $("<tr></tr>");
        titulos.forEach(header => {
            headerRow.append($("<th></th>").text(header));
        });
        $table.append(headerRow);

        const headers = Object.keys(csvContent[0]);
        csvContent.forEach(rowData => {
            const $row = $("<tr></tr>"); // Create a new table row
            headers.forEach(header => {
                var $cell = $("<td></td>").text(rowData[header] || ""); // Get cell data by key
                $row.append($cell); // Append the cell to the row
            });
            $table.append($row); // Append the row to the table
        });
    }


    // Convertir el contenido CSV a un array de objetos
    function parseCSV(content) {
        const lines = content.split('\n');
        const result = [];
        lines.slice(2).forEach(line => {
            const fields = line.split(';');
            if (fields.length > 1) {
                result.push({
                    fecha: fields[0],
                    despertar: fields[1],
                    comida: fields[2],
                    cagar: fields[3],
                    ducha: fields[4],
                    afeitar: fields[5],
                    peso: fields[6],
                    ejercicio: fields[7],
                    pajas: fields[8],
                    dormir: fields[9],
                    mood: fields[10],
                    fatiga: fields[11],
                    otros: fields[12]
                });
            }
        });
        return result;
    }

    // Mostrar fechas disponibles en el selector
    function loadAvailableDates() {
        const dates = csvContent.map(entry => entry.fecha);
        $('#select-date').empty();
        //$('#select-date').val(yesterdayDate);      //Seleciona automaticamnte la fecha de ayer
        dates.forEach(date => {
            $('#select-date').append(`<option value="${date}">${date}</option>`);
        });
    }

    //Limpiar los campos del formulario
    function cleanFormInputs() {
        $('#despertar').val("");
        $('#comida').val("");
        $('#cagar').val("");
        $('#ducha').prop('checked', false);
        $('#afeitar').prop('checked', false);
        $('#peso').val("");
        $('#ejercicio').val("");
        $('#pajas').val("");
        $('#dormir').val("");
        $('#mood').val("");
        $('#fatiga').val("");
        $('#otros').val("");
    }

    // Mostrar formularios
    $('#create-report').click(function() {
        $('#choose-action').hide();
        $('#report-form').show();
        $('#fecha').val(yesterdayDate);
    });

    $('#modify-report').click(function() {
        $('#choose-action').hide();
        $('#modify-form').show();
    });

    // Mostrar estadísticas
    $('#show-raw-data').click(function() {
        $('#choose-action').hide();
        $('#raw-data-visualization').show();
    });

    // Mostrar selector de datos analizados
    $('#show-analized-data').click(function() {
        $('#choose-action').hide();
        $('#analized-data-visualization').show();
    });

    // Mostrar medias
    $('#go-to-medias').click(function() {
        $('#medias-div').show();
        $('#charts-div').hide();
    });

    // Mostrar categorias graficas
    $('#go-to-charts').click(function() {
        $('#charts-div').show();
        $('#charts-div').css('display', 'flex').css('flex-wrap', 'wrap');
        $('#medias-div').hide();
    });
    
    // Manejar todas las categorias
        // Dormir
        $('#go-to-chart-dormir').click(function() {
            if (!$('#chartCategoriaDormirDiv').is(":hidden")) {
                $('#chartCategoriaDormirDiv').hide();
            }else{
                $('#chartCategoriaDormirDiv').show();
            }
            $('#chartCategoriaComerDiv').hide();
            $('#chartCategoriaCagarDiv').hide();
            $('#chartCategoriaEjercicioDiv').hide();
            $('#chartCategoriaPajasDiv').hide();
            $('#chartCategoriaOtrosDiv').hide();
        });
        // Comer
        $('#go-to-chart-comer').click(function() {
            $('#chartCategoriaDormirDiv').hide();
            if (!$('#chartCategoriaComerDiv').is(":hidden")) {
                $('#chartCategoriaComerDiv').hide();
            }else{
                $('#chartCategoriaComerDiv').show();
            }
            $('#chartCategoriaCagarDiv').hide();
            $('#chartCategoriaEjercicioDiv').hide();
            $('#chartCategoriaPajasDiv').hide();
            $('#chartCategoriaOtrosDiv').hide();
        });
        // Cagar
        $('#go-to-chart-cagar').click(function() {
            $('#chartCategoriaDormirDiv').hide();
            $('#chartCategoriaComerDiv').hide();
            if (!$('#chartCategoriaCagarDiv').is(":hidden")) {
                $('#chartCategoriaCagarDiv').hide();
            }else{
                $('#chartCategoriaCagarDiv').show();
            }
            $('#chartCategoriaEjercicioDiv').hide();
            $('#chartCategoriaPajasDiv').hide();
            $('#chartCategoriaOtrosDiv').hide();
        });
        // Ejercicio
        $('#go-to-chart-ejercicio').click(function() {
            $('#chartCategoriaDormirDiv').hide();
            $('#chartCategoriaComerDiv').hide();
            $('#chartCategoriaCagarDiv').hide();
            if (!$('#chartCategoriaEjercicioDiv').is(":hidden")) {
                $('#chartCategoriaEjercicioDiv').hide();
            }else{
                $('#chartCategoriaEjercicioDiv').show();
            }
            $('#chartCategoriaPajasDiv').hide();
            $('#chartCategoriaOtrosDiv').hide();
        });
        // Pajas
        $('#go-to-chart-pajas').click(function() {
            $('#chartCategoriaDormirDiv').hide();
            $('#chartCategoriaComerDiv').hide();
            $('#chartCategoriaCagarDiv').hide();
            $('#chartCategoriaEjercicioDiv').hide();
            if (!$('#chartCategoriaPajasDiv').is(":hidden")) {
                $('#chartCategoriaPajasDiv').hide();
            }else{
                $('#chartCategoriaPajasDiv').show();
            }
            $('#chartCategoriaOtrosDiv').hide();
        });
        // Otros
        $('#go-to-chart-otros').click(function() {
            $('#chartCategoriaDormirDiv').hide();
            $('#chartCategoriaComerDiv').hide();
            $('#chartCategoriaCagarDiv').hide();
            $('#chartCategoriaEjercicioDiv').hide();
            $('#chartCategoriaPajasDiv').hide();
            if (!$('#chartCategoriaOtrosDiv').is(":hidden")) {
                $('#chartCategoriaOtrosDiv').hide();
            }else{
                $('#chartCategoriaOtrosDiv').show();
            }
        });

    // Volver al selector de acción
    $('#back-to-selector').click(function() {
        $('#report-form').hide();
        $('#choose-action').show();
    });

    $('#back-to-selector-modify').click(function() {
        $('#modify-form').hide();
        $('#choose-action').show();
    });
    $('.back-to-selector-raw-data').click(function() {
        $('#raw-data-visualization').hide();
        $('#choose-action').show();
    });
    $('#back-to-selector-analized-data').click(function() {
        $('#charts-div').hide();
        $('#medias-div').hide();
        $('#analized-data-visualization').hide();
        $('#choose-action').show();
    });

    // Agrandar graficas
    $(".zoomButton").click(function (e) {
        $(this).closest(".chartDiv").addClass("fullscreen");
        $(this).closest("h3").hide();
        $(this).closest(".chartDiv").find(".chartExtras").hide();
        $(this).closest(".zoomBackButton").show();
        $(this).closest(".zoomButton").hide();
        e.stopPropagation();
    });

    // Quitar el fullscreen de las graficas
    $(document).click(function (event) {
        if (!$(".chartDiv.fullscreen").length) return;

        if (!$(event.target).closest(".chartDiv").length) {
            $(".chartDiv.fullscreen").find("h3").show();
            $(".chartDiv.fullscreen").find(".chartExtras").show();
            $(".chartDiv.fullscreen").find(".zoomButton").show();
            $(".chartDiv.fullscreen").removeClass("fullscreen");
        }
    });



    // Gestionar botones de añadir entradas

    // PAJA
    // Show the pop-up when the button is clicked
    $('#addPaja').click(function () {
        $('#popup-overlay-paja, #popup-modal-paja').fadeIn();

      // Close the pop-up
      $('#cancel-btn-paja').click(function () {
        $('#popup-overlay-paja, #popup-modal-paja').fadeOut();
      });

      // Confirm and fill the text input
      $('#confirm-btn-paja').click(function () {
        var finalText = "";
        finalText += "(" + $('#horaPaja').val() + ", ";
        finalText += $('#duracionPaja').val() + ", ";
        finalText += $('#tipoPaja').val() + ", ";
        finalText += $('#temaPaja').val() + ")";

        if ($('#pajas').val() != ""){
            $('#pajas').val($('#pajas').val() + ", ");
        }
        $('#pajas').val($('#pajas').val() + finalText);



        // Close the modal
        $('#popup-overlay-paja, #popup-modal-paja').fadeOut();

        // Clear inputs
        $('#horaPaja').val('');
        $('#duracionPaja').val('');
        $('#tipoPaja').val('');
        $('#temaPaja').val('');
        finalText = "";
      });
      
    });

    // Cagar
    // Show the pop-up when the button is clicked
    $('#addCagar').click(function () {
        $('#popup-overlay-cagar, #popup-modal-cagar').fadeIn();

      // Close the pop-up
      $('#cancel-btn-cagar').click(function () {
        $('#popup-overlay-cagar, #popup-modal-cagar').fadeOut();
      });

      // Confirm and fill the text input
      $('#confirm-btn-cagar').click(function () {
        var finalText = "";
        finalText += "(" + $('#horaCagar').val() + ", ";
        finalText += $('#tiempoCagar').val() + ", ";
        finalText += $('#tiempoLimpiar').val() + ")";

        if ($('#cagar').val() != ""){
            $('#cagar').val($('#cagar').val() + ", ");
        }
        $('#cagar').val($('#cagar').val() + finalText);



        // Close the modal
        $('#popup-overlay-cagar, #popup-modal-cagar').fadeOut();

        // Clear inputs
        $('#horaCagar').val('');
        $('#tiempoCagar').val('');
        $('#tiempoLimpiar').val('');
        finalText = "";
      });

    });

    // Cargar reporte para modificar
    $('#load-report').click(function() {
        const selectedDate = $('#select-date').val();
        loadReport(selectedDate);
        $('#select-date').val("");
        $('#report-form').show();
        $('#modify-form').hide();
    });

    // Avisar si la fecha seleccionada existe en el reporte y desactivar el botón hasta que se selecione una fecha
    $('#load-report').prop("disabled",true);
    $('#select-date').change(function() {
        $('#load-report').prop("disabled",false);
        if (csvContent.find(entry => entry.fecha == $('#select-date').val())){
            $('#load-report').html("Cargar Reporte");
        }else{
            $('#load-report').html("Cargar Reporte\nATENCIÓN: la fecha aun no tiene reportes");
        }
    });

    // Tiempo a segundos
    function timeToSeconds(time){
        if (time == null){
            return 0;
        }
        const minutes = parseInt(time.split(":")[0], 10);
        const seconds = parseInt(time.split(":")[1], 10);

        return minutes * 60 + seconds;
    }

    // Segundos a tiempo
    function secondsToTime(seconds){
        seconds = parseInt(seconds);
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor(seconds % 3600 / 60);
        const remainingSeconds = seconds % 60;

        if (hours == 0){
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        }else{
            return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
        
    }

    // Cargar datos en el formulario de modificación
    function loadReport(date) {
        const report = csvContent.find(entry => entry.fecha === date);
        $('#fecha').val(date);
        if (report) {
            $('#despertar').val(report.despertar);
            $('#comida').val(report.comida);
            $('#cagar').val(report.cagar);
            if (report.ducha == "si") {$('#ducha').prop('checked', true)};
            if (report.afeitar == "si") {$('#afeitar').prop('checked', true)};
            $('#peso').val(report.peso);
            $('#ejercicio').val(report.ejercicio);
            $('#pajas').val(report.pajas);
            $('#dormir').val(report.dormir);
            $('#mood').val(report.mood);
            $('#fatiga').val(report.fatiga);
            $('#otros').val(report.otros);
        }
    }

    // Guardar el reporte en el archivo CSV y hacer commit
    $('#save-report').click(function(event) {
        event.preventDefault();
        const formData = $('#report-form-fields').serializeArray();
        
        saveReport(formData);

        console.log("Contenido de formData:");
        console.log(formData);
    });

    // Guardar el reporte actualizado
    function saveReport(formData) {
        let formularioBien = true;
        let erroresFormulario = "";

        var duchaVal = "si"
        var afeitarVal = "si"
        if (!$('#ducha').is(':checked')){
            duchaVal = "no"
        }
        if (!$('#afeitar').is(':checked')){
            afeitarVal = "no"
        }
        const formDataObject = Object.fromEntries(
            formData.map(field => [field.name, field.value])
        );

        // Comprobar el formato de los datos
        let horaRegex = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
        let cagarRegex = /^\(\d{2}:\d{2}, \d{1,2}:\d{2}, \d{1,2}:\d{2}\)(, \(\d{2}:\d{2}, \d{1,2}:\d{2}, \d{1,2}:\d{2}\))*$/;
        let pajasRegex = /^\((?:[01]\d|2[0-3]):[0-5]\d,\s*[A-Za-z]+,\s*[A-Za-z]+,\s*[A-Za-z]+(?:\s+[A-Za-z]+)*(?:,\s*[^)]+)?\)$/;

        if (!horaRegex.test(formDataObject.despertar)) {
            $('#despertar').addClass('error');
            formularioBien = false;
            erroresFormulario += "despertar, ";
        } else {
            $('#despertar').removeClass('error');
        }
        
        if (!horaRegex.test(formDataObject.dormir)) {
            $('#dormir').addClass('error');
            formularioBien = false;
            erroresFormulario += "dormir, ";
        } else {
            $('#dormir').removeClass('error');
        }

        if (formDataObject.cagar != ""){
            if (!cagarRegex.test(formDataObject.cagar)) {
                $('#cagar').addClass('error');
                formularioBien = false;
                erroresFormulario += "cagar, ";
            } else {
                $('#cagar').removeClass('error');
            }
        }

        if (formDataObject.pajas != ""){
            if (!pajasRegex.test(formDataObject.pajas)) {
                $('#pajas').addClass('error');
                formularioBien = false;
                erroresFormulario += "pajas, ";
            } else {
                $('#pajas').removeClass('error');
            }
        }


        if (formularioBien){
            const newReport = {
                fecha: formDataObject.fecha,
                despertar: formDataObject.despertar,
                comida: formDataObject.comida.replace("á","a").replace("é","e").replace("í","i").replace("ó","o").replace("ú","u"),
                cagar: formDataObject.cagar,
                ducha: duchaVal,
                afeitar: afeitarVal,
                peso: formDataObject.peso,
                ejercicio: formDataObject.ejercicio,
                pajas: formDataObject.pajas.replace("á","a").replace("é","e").replace("í","i").replace("ó","o").replace("ú","u"),
                dormir: formDataObject.dormir,
                mood: formDataObject.mood,
                fatiga: formDataObject.fatiga,
                otros: formDataObject.otros.replace("á","a").replace("é","e").replace("í","i").replace("ó","o").replace("ú","u")
            };
        
            // Actualizar el CSV con la nueva o modificada entrada
            var updatedCSV = [...csvContent.filter(report => report.fecha !== formData[0].value), newReport];

            // Ordenar el CSV por fecha
            updatedCSV.sort(function(a, b) {
                return new Date(a.fecha) - new Date(b.fecha);
            });
        
            console.log("Contenido de updatedCSV:");
            console.log(updatedCSV);
            // Convertir de nuevo a CSV
            var csvText = "seq=;\n" + "dia;despertar;comida;cagar;ducha;afeitar;peso;ejercicio;pajas;dormir;mood;fatiga;otros\n"
            csvText += updatedCSV.map(entry => {
                return `${entry.fecha};${entry.despertar};${entry.comida};${entry.cagar};${entry.ducha};${entry.afeitar};${entry.peso};${entry.ejercicio};${entry.pajas};${entry.dormir};${entry.mood};${entry.fatiga};${entry.otros}`;
            }).join('\n');
        
            console.log("Contenido de csvText:");
            console.log(csvText);
            // Obtener el SHA del archivo existente
            const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
            $.ajax({
                url: url,
                method: 'GET',
                headers: {
                    'Authorization': `token ${tokenEditar}`
                },
                success: function(response) {
                    const sha = response.sha;  // SHA del archivo existente
                    updateFile(csvText, sha);
                },
                error: function() {
                    alert('Error al obtener el archivo para obtener el SHA');
                }
            });
        }else{
            alert("Hay errores en " + erroresFormulario);
        }
    }
    
    function updateFile(csvText, sha) {
        // Hacer commit del nuevo contenido en GitHub
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
        $.ajax({
            url: url,
            method: 'PUT',
            headers: {
                'Authorization': `token ${tokenEditar}`
            },
            data: JSON.stringify({
                message: 'Actualizar reporte diario',
                content: btoa(csvText),  // Convertir el contenido a Base64
                sha: sha  // Incluir el SHA del archivo actual
            }),
            success: function() {
                alert('Reporte guardado con éxito');
                $('#report-form').hide();
                $('#choose-action').show();
                inicio();
                cleanFormInputs();
            },
            error: function(response) {
                console.log(response);
                alert('Error al guardar el reporte. Revisa la consola para detalles.');
            }
        });
    }

    function getWeekDay(date) {
        const daysOfWeek = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
        return daysOfWeek[new Date(date).getDay()];
    }

    function getPreviousWeekDay(date) {
        const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
        return daysOfWeek[new Date(date).getDay()];
    }

    function getNextWeekDay(date) {
        const daysOfWeek = ["Sábado", "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
        return daysOfWeek[new Date(date).getDay()];
    }

    function GetURLParameter(sParam) {
        var sPageURL = window.location.search.substring(1);
        var sURLVariables = sPageURL.split('&');
        for (var i = 0; i < sURLVariables.length; i++) {
            var sParameterName = sURLVariables[i].split('=');
            if (sParameterName[0] == sParam) {
                return sParameterName[1];
            }
        }
        return "";
    }

    function getTimeDifference(startTime, endTime) {
        // Parse the input times
        var start = moment(startTime, "HH:mm");
        var end = moment(endTime, "HH:mm");

        // If the end time is before the start time, add 1 day to the end time
        if (end.isBefore(start)) {
            end.add(1, 'days');
        }

        // Calculate the difference in hours
        var duration = moment.duration(end.diff(start));
        var hours = duration.asHours();

        return hours;
    }

    function checkIfWeekendSegment(date) {
        if (getPreviousWeekDay(date) == "Sábado" || getPreviousWeekDay(date) == "Domingo") {
            return true;
        }else{
            return false;
        }
    }

    function checkIfWeekend(date) {
        if (getWeekDay(date) == "Sábado" || getWeekDay(date) == "Domingo") {
            return true;
        }else{
            return false;
        }
    }

    function getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

        // Set to nearest Thursday (current date + 4 - current day number)
        const dayNum = d.getUTCDay() || 7; 
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);

        // January 1st of this year
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));

        // Calculate full weeks to nearest Thursday
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    function aaa(cosa){
        console.log(cosa);
    }

});