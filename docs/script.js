$(document).ready(function() {
    const baseDate = new Date();
    const currentDate = baseDate.getFullYear() + '-' + ('0' + (baseDate.getMonth() + 1)).slice(-2) + '-' + ('0' + baseDate.getDate()).slice(-2);
    const token1 = 'github_pat_11ANGJOYQ0PUIqeOOMF0hN_HfOdAxeQaRlVp';
    const token2 = 'UGGupWLRGLWZeXcIUlNFcFKRWtgD2lACAO4GQ5IfqGPs6f';
    const token = token1 + token2;
    const owner = 'megabentilad';
    const repo = 'Estadisticas';
    const filePath = 'docs/base.csv';

    let csvContent = [];

    // Cargar el archivo CSV completo al inicio
    console.log("Duodécimo commit");
    loadCSVContent();

    function loadCSVContent() {
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
                if (csvContent.find(entry => entry.fecha === date)){
                    $('#create-report').html("Ya existe un reporte para hoy");
                    $('#create-report').prop("disabled",true);
                    $('#create-report').css("background-color", "#e6834a");
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
        //$('#select-date').val(currentDate);      //Seleciona automaticamnte la fecha actual
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
        $('#fecha').val(currentDate);
    });

    $('#modify-report').click(function() {
        $('#choose-action').hide();
        $('#modify-form').show();
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

    // Cargar reporte para modificar
    $('#load-report').click(function() {
        const selectedDate = $('#select-date').val();
        loadReport(selectedDate);
        $('#report-form').show();
        $('#modify-form').hide();
    });

    // Cargar datos en el formulario de modificación
    function loadReport(date) {
        const report = csvContent.find(entry => entry.fecha === date);
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
        const formData = "seq=;\n"
        formData += $('#report-form-fields').serializeArray();
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
        const updatedCSV = [...csvContent.filter(report => report.fecha !== formData[0].value), newReport];
    
        console.log("Contenido de updatedCSV:");
        console.log(updatedCSV);
        // Convertir de nuevo a CSV
        const csvText = updatedCSV.map(entry => {
            return `${entry.fecha};${entry.despertar};${entry.comida};${entry.cagar};${entry.ducha};${entry.afeitar};${entry.ejercicio};${entry.pajas};${entry.dormir};${entry.mood};${entry.fatiga};${entry.otros}`;
        }).join('\n');
    
        console.log("Contenido de csvText:");
        console.log(formData);
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
});