$(document).ready(function() {
    const baseDate = new Date();
    const currentDate = currentDate.getFullYear() + '-' + ('0' + (currentDate.getMonth() + 1)).slice(-2) + '-' + ('0' + currentDate.getDate()).slice(-2);
    const token1 = 'github_pat_11ANGJOYQ0PUIqeOOMF0hN_HfOdAxeQaRlVp';
    const token2 = 'UGGupWLRGLWZeXcIUlNFcFKRWtgD2lACAO4GQ5IfqGPs6f';
    const token = token1 + token2;
    const owner = 'megabentilad';
    const repo = 'Estadisticas';
    const filePath = 'docs/base.csv';

    let csvContent = [];

    // Cargar el archivo CSV completo al inicio
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
                console.log(content);
            }
        });
    }

    // Convertir el contenido CSV a un array de objetos
    function parseCSV(content) {
        const lines = content.split('\n');
        const result = [];
        lines.forEach(line => {
            const fields = line.split(';');
            if (fields.length > 1) {
                result.push({
                    fecha: fields[0],
                    despertar: fields[1],
                    comida: fields[2],
                    cagar: fields[3],
                    ducha: fields[4],
                    afeitar: fields[5],
                    ejercicio: fields[6],
                    pajas: fields[7],
                    dormir: fields[8],
                    mood: fields[9],
                    fatiga: fields[10],
                    otros: fields[11]
                });
            }
        });
        return result;
    }

    // Mostrar fechas disponibles en el selector
    function loadAvailableDates() {
        const dates = csvContent.map(entry => entry.fecha);
        $('#select-date').empty();
        dates.forEach(date => {
            $('#select-date').append(`<option value="${date}">${date}</option>`);
        });
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
        const date = $('#fecha').val();
        saveReport(date, formData);
    });

    // Guardar el reporte actualizado
    function saveReport(date, formData) {
        const newReport = {
            fecha: date,
            despertar: formData[0].value,
            comida: formData[1].value,
            cagar: formData[2].value,
            ducha: formData[3].value,
            afeitar: formData[4].value,
            ejercicio: formData[5].value,
            pajas: formData[6].value,
            dormir: formData[7].value,
            mood: formData[8].value,
            fatiga: formData[9].value,
            otros: formData[10].value
        };
    
        // Actualizar el CSV con la nueva o modificada entrada
        const updatedCSV = [...csvContent.filter(report => report.fecha !== date), newReport];
    
        // Convertir de nuevo a CSV
        const csvText = updatedCSV.map(entry => {
            return `${entry.fecha};${entry.despertar};${entry.comida};${entry.cagar};${entry.ducha};${entry.afeitar};${entry.ejercicio};${entry.pajas};${entry.dormir};${entry.mood};${entry.fatiga};${entry.otros}`;
        }).join('\n');
    
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
            },
            error: function(response) {
                console.log(response);
                alert('Error al guardar el reporte. Revisa la consola para detalles.');
            }
        });
    }
});