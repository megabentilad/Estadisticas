$(document).ready(function() {
    const currentDate = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
    const token = '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';
    const owner = 'megabentilad';
    const repo = 'https://github.com/megabentilad/Estadisticas';
    const filePath = 'docs/base.csv';

    $('#create-report').click(function() {
        $('#choose-action').hide();
        $('#report-form').show();
        $('#fecha').val(currentDate);
    });

    $('#modify-report').click(function() {
        $('#choose-action').hide();
        $('#modify-form').show();
        loadAvailableDates();  // Cargar fechas disponibles
    });

    $('#load-report').click(function() {
        const selectedDate = $('#select-date').val();
        loadReport(selectedDate);
    });

    $('#save-report').click(function(event) {
        event.preventDefault();
        const formData = $('#report-form-fields').serializeArray();
        const date = $('#fecha').val();
        saveReport(date, formData);
    });

    function loadAvailableDates() {
        // Cargar las fechas disponibles del archivo CSV en GitHub
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
        $.ajax({
            url: url,
            headers: {
                'Authorization': `token ${token}`
            },
            success: function(response) {
                const content = atob(response.content); // Decodificar el contenido base64 del archivo CSV
                const dates = [];
                const lines = content.split('\n');
                lines.forEach(line => {
                    const date = line.split(';')[0];
                    if (date) dates.push(date);
                });

                $('#select-date').empty();
                dates.forEach(date => {
                    $('#select-date').append(`<option value="${date}">${date}</option>`);
                });
            }
        });
    }

    function loadReport(date) {
        // Cargar los datos del reporte desde el CSV
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
        $.ajax({
            url: url,
            headers: {
                'Authorization': `token ${token}`
            },
            success: function(response) {
                const content = atob(response.content); // Decodificar el contenido base64 del archivo CSV
                const lines = content.split('\n');
                const targetLine = lines.find(line => line.startsWith(date));
                if (targetLine) {
                    const fields = targetLine.split(';');
                    $('#despertar').val(fields[1]);
                    $('#comida').val(fields[2]);
                    $('#cagar').val(fields[3]);
                    $('#ducha').val(fields[4]);
                    $('#afeitar').val(fields[5]);
                    $('#ejercicio').val(fields[6]);
                    $('#pajas').val(fields[7]);
                    $('#dormir').val(fields[8]);
                    $('#mood').val(fields[9]);
                    $('#fatiga').val(fields[10]);
                    $('#otros').val(fields[11]);
                }
            }
        });
    }

    function saveReport(date, formData) {
        // Guardar los datos del reporte en el archivo CSV y hacer commit
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
        $.ajax({
            url: url,
            method: 'GET',
            headers: {
                'Authorization': `token ${token}`
            },
            success: function(response) {
                const content = atob(response.content); // Decodificar el contenido base64 del archivo CSV
                let csvContent = content.split('\n');

                // Modificar o agregar la línea del reporte
                const newLine = `${date};${formData[0].value};${formData[1].value};${formData[2].value};${formData[3].value};${formData[4].value};${formData[5].value};${formData[6].value};${formData[7].value};${formData[8].value};${formData[9].value};${formData[10].value};${formData[11].value}`;
                
                let found = false;
                csvContent = csvContent.map(line => {
                    if (line.startsWith(date)) {
                        found = true;
                        return newLine; // Reemplazar la línea correspondiente
                    }
                    return line;
                });

                if (!found) {
                    csvContent.push(newLine); // Si no existe, agregarla
                }

                // Subir el archivo modificado
                const updatedContent = btoa(csvContent.join('\n')); // Codificar nuevamente en base64
                $.ajax({
                    url: url,
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${token}`
                    },
                    data: JSON.stringify({
                        message: 'Actualizar reporte diario',
                        content: updatedContent,
                        sha: response.sha
                    }),
                    success: function() {
                        alert('Reporte guardado y commit realizado');
                    },
                    error: function() {
                        alert('Error al guardar el reporte');
                    }
                });
            }
        });
    }
});
