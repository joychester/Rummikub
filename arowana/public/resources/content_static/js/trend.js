$(function () {
    $('#perftrend').highcharts({
        chart: {
            type: 'area'
        },
        title: {
            text: 'Perf trend'
        },
        xAxis: {
            categories: ['Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat', 'Sun']
        },
        yAxis: {
            title: {
                text: 'Response Time'
            }
        },
        series: [{
            name: 'Sell_API',
            data: [100, 120, 125, 110, 99, 130, 105]
        }, {
            name: 'Buy_API',
            data: [220, 220, 225, 200, 199, 230, 205]
        }]
    });
});