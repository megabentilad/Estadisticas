$(document).ready(function() {
    const currentDate = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
    const token = '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';
    const owner = 'megabentilad';
    const repo = 'Estadisticas';
    const filePath = 'docs/base.csv';

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
    });

    // Guardar reporte
    $('#save-report').click(function(event) {
        event.preventDefault();
        const formData = $('#report-form-fields').serializeArray();
        const date = $('#fecha').val();
        saveReport(date, formData);
    });

    // Función para cargar las fechas disponibles en el archivo CSV
    function loadAvailableDates() {
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
        $.ajax({
            url: url,
            headers: {
                'Authorization': `token ${token}`
            },
            success: function(response) {
                const content = atob(response.content);
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

    // Cargar el reporte desde el archivo CSV
    function loadReport(date) {
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
        $.ajax({
            url: url,
            headers: {
                'Authorization': `token ${token}`
            },
            success: function(response) {
                const content = atob(response.content);
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

    // Guardar el reporte en el archivo CSV y hacer commit
    function saveReport(date, formData) {
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
        $.ajax({
            url: url,
            method: 'GET',
            headers: {
                'Authorization': `token ${token}`
            },
            success: function(response) {
                const content = atob(response.content);
                let csvContent = content.split('\n');

                const newLine = `${date};${formData[0].value};${formData[1].value};${formData[2].value};${formData[3].value};${formData[4].value};${formData[5].value};${formData[6].value};${formData[7].value};${formData[8].value};${formData[9].value};${formData[10].value}`;

                let found = false;
                csvContent = csvContent.map(line => {
                    if (line.startsWith(date)) {
                        found = true;
                        return newLine;
                    }
                    return line;
                });

                if (!found) {
                    csvContent.push(newLine);
                }

                const updatedContent = btoa(csvContent.join('\n'));
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
                        alert('Reporte guardado con éxito');
                        $('#report-form').hide();
                        $('#choose-action').show();
                    },
                    error: function() {
                        alert('Error al guardar el reporte');
                    }
                });
            }
        });
    }
});