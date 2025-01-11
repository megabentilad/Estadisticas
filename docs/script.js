$(document).ready(function() {
    const baseDate = new Date();
    const baseYesterdayDate = new Date(baseDate);
    baseYesterdayDate.setDate(baseDate.getDate() - 1)
    //const currentDate = baseDate.getFullYear() + '-' + ('0' + (baseDate.getMonth() + 1)).slice(-2) + '-' + ('0' + baseDate.getDate()).slice(-2);
    const yesterdayDate = baseYesterdayDate.getFullYear() + '-' + ('0' + (baseYesterdayDate.getMonth() + 1)).slice(-2) + '-' + ('0' + baseYesterdayDate.getDate()).slice(-2);
    const yesterdayWeekDay = getWeekDay(baseYesterdayDate);
    const tokenVer1 = 'github_pat_11ANGJOYQ0KYo7NStzY7fS_Sq8gFZTuM9u';
    const tokenVer2 = 'jfIj6mcVK0YCXZ6p6cjI1QCjHay5b1rcUWHKTAE34QQPhmik';
    const tokenVer = tokenVer1 + tokenVer2;
    const tokenEditar = prompt("Ingresa el token de git para poder editar:");
    const owner = 'megabentilad';
    const repo = 'Estadisticas';
    const filePath = 'docs/base.csv';

    let csvContent = [];

    // Cargar el archivo CSV completo al inicio
    console.log("Decimonoveno commit");
    
    if (tokenEditar == null) {
        loadCSVContent(tokenVer);
    }else{
        loadCSVContent(tokenEditar);
    }

    function loadCSVContent(token) {
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
        $.ajax({
            url: url,
            headers: {
                'Authorization': `token ${token}`
            },
            success: function(response) {
                const content = atob(response.content);
                csvContent = parseCSV(content);
                // Cargar las fechas disponibles para modificar reportes
                loadAvailableDates();

                //Mostrar los datos en consola
                console.log("Contenido del fichero CSV:");
                console.log(content);
                console.log("Contenido del array:");
                console.log(csvContent);
                
                //Mirar si el reporte del día ya ha sido creado y desactivar el botón si es el caso
                if (csvContent.find(entry => entry.fecha === yesterdayDate)){
                    $('#create-report').html("Ya existe un reporte para ayer " + yesterdayWeekDay + " " + yesterdayDate);
                    $('#create-report').prop("disabled",true);
                    $('#create-report').css("background-color", "#e6834a").css("cursor", "not-allowed");
                }else{
                    $('#create-report').html("Rellenar el reporte de ayer " + yesterdayWeekDay + " " + yesterdayDate);
                }

                // Si no hay token para editar, ocultar las opciones de edición
                if (tokenEditar == null) {
                    $('#create-report').hide();
                    $('#modify-report').hide();
                }

                // Rellenar la tabla de datos en bruto
                const $table = $("#raw-data-table");

                csvContent.forEach(rowData => {
                    const $row = $("<tr></tr>"); // Create a new row
                    rowData.forEach(cellData => {
                        const $cell = $("<td></td>").text(cellData); // Create a new cell
                        $row.append($cell); // Append the cell to the row
                    });
                    $table.append($row); // Append the row to the table
                });

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
        $('#ducha').val("");
        $('#afeitar').val("");
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


    // Volver al selector de acción
    $('#back-to-selector').click(function() {
        $('#report-form').hide();
        $('#choose-action').show();
    });

    $('#back-to-selector-modify').click(function() {
        $('#modify-form').hide();
        $('#choose-action').show();
    });
    $('#back-to-selector-raw-data').click(function() {
        $('#raw-data-visualization').hide();
        $('#choose-action').show();
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
        if (csvContent.find(entry => entry.fecha !== $('#select-date').val())){
            $('#load-report').html("Cargar Reporte\nATENCIÓN: la fecha aun no tiene reportes");
        }else{
            $('#load-report').html("Cargar Reporte");
        }
    });

    // Cargar datos en el formulario de modificación
    function loadReport(date) {
        const report = csvContent.find(entry => entry.fecha === date);
        $('#fecha').val(date);
        if (report) {
            $('#despertar').val(report.despertar);
            $('#comida').val(report.comida);
            $('#cagar').val(report.cagar);
            $('#ducha').val(report.ducha);
            $('#afeitar').val(report.afeitar);
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
        const newReport = {
            fecha: formData[0].value,
            despertar: formData[1].value,
            comida: formData[2].value,
            cagar: formData[3].value,
            ducha: formData[4].value,
            afeitar: formData[5].value,
            peso: formData[6].value,
            ejercicio: formData[7].value,
            pajas: formData[8].value,
            dormir: formData[9].value,
            mood: formData[10].value,
            fatiga: formData[11].value,
            otros: formData[12].value
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
                'Authorization': `token ${token}`
            },
            success: function(response) {
                const sha = response.sha;  // SHA del archivo existente
                updateFile(csvText, sha);
            },
            error: function() {
                alert('Error al obtener el archivo para obtener el SHA');
            }
        });
    }
    
    function updateFile(csvText, sha) {
        // Hacer commit del nuevo contenido en GitHub
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
        $.ajax({
            url: url,
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`
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
                loadCSVContent();
                cleanFormInputs();
            },
            error: function(response) {
                console.log(response);
                alert('Error al guardar el reporte. Revisa la consola para detalles.');
            }
        });
    }

    function getWeekDay(date) {
        const daysOfWeek = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sabado"];
        return daysOfWeek[dayIndex];
    }
});