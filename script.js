const stocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'PYPL', 'TSLA', 'JPM', 'NVDA', 'NFLX', 'DIS'];
let currentSymbol = 'AAPL';
let currentPeriod = '1mo';
let chart;

window.onload = () => {
  renderStockList();
  fetchChart(currentSymbol, currentPeriod);
  fetchDetails(currentSymbol);
};

async function renderStockList() {
  try {
    const res1 = await fetch("https://stocksapi-uhe1.onrender.com/api/stocks/getstockstatsdata");
    const statsRes = await res1.json();
    const statsData = statsRes.stocksStatsData[0];

    const list = document.getElementById("stockList");
    list.innerHTML = "";

    stocks.forEach(symbol => {
      const stock = statsData[symbol];
      const profitColor = stock.profit > 0 ? "text-success" : "text-danger";

      const item = document.createElement("div");
      item.className = "stock-item d-flex justify-content-between align-items-center";
      item.innerHTML = `
        <strong>${symbol}</strong>
        <span>$${stock.bookValue}</span>
        <span class="${profitColor}">${(stock.profit * 100).toFixed(2)}%</span>
      `;
      item.onclick = () => {
        currentSymbol = symbol;
        fetchChart(symbol, currentPeriod);
        fetchDetails(symbol);
      };
      list.appendChild(item);
    });
  } catch (err) {
    console.error("Error loading stock list:", err);
  }
}

async function fetchChart(symbol, period) {
    try {
      const res = await fetch("https://stocksapi-uhe1.onrender.com/api/stocks/getstocksdata");
      const data = await res.json();
      const allData = data.stocksData[0];
  
      const stockSeriesRaw = allData[symbol][period];
      const values = stockSeriesRaw.value;
      const timeStamps = stockSeriesRaw.timeStamp;
  
      if (!values || !timeStamps || values.length === 0 || timeStamps.length === 0) {
        console.warn("Invalid or empty data for chart", values, timeStamps);
        return;
      }
  
      const stockSeries = timeStamps.map((time, index) => ({
        time: Number(time),
        value: Number(values[index])
      }));
  
      const labels = stockSeries.map(d => new Date(d.time * 1000).toLocaleDateString());
      const prices = stockSeries.map(d => d.value);
  
      const ctx = document.getElementById("stockChart").getContext("2d");
      if (chart) chart.destroy();
  
     
      const verticalHoverPlugin = {
        id: 'hoverLine',
        afterDraw(chart) {
          if (chart.tooltip?._active && chart.tooltip._active.length) {
            const ctx = chart.ctx;
            const point = chart.tooltip._active[0];
            const x = point.element.x;
            const y = point.element.y;
            const yValue = point.element.$context.raw;
            const dateLabel = chart.data.labels[point.index];
  
            ctx.save();
  
            
            ctx.beginPath();
            ctx.moveTo(x, chart.chartArea.top);
            ctx.lineTo(x, chart.chartArea.bottom);
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = 'white';
            ctx.stroke();
  
            
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = 'lime';
            ctx.fill();
  
            
            ctx.font = 'bold 13px Arial';
            ctx.fillStyle = 'white';
            ctx.fillText(`${symbol}: $${yValue.toFixed(2)}`, x + 10, y - 10);
  
            
            ctx.fillStyle = '#ccc';
            ctx.fillText(`${dateLabel}`, x - 30, chart.chartArea.bottom + 20);
  
            ctx.restore();
          }
        }
      };
  
      chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: `${symbol} Price`,
            data: prices,
            borderColor: 'lime',
            backgroundColor: 'transparent',
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: 'lime',
            tension: 0.3
          }]
        },
        options: {
          responsive: true,
          interaction: {
            mode: 'index',
            intersect: false
          },
          plugins: {
            tooltip: {
              enabled: false 
            },
            legend: {
              labels: {
                color: "white"
              }
            }
          },
          scales: {
            x: {
              ticks: { color: "white" },
              grid: {
                color: "rgba(255,255,255,0.1)"
              }
            },
            y: {
              ticks: { color: "white" },
              grid: {
                color: "rgba(255,255,255,0.05)"
              }
            }
          }
        },
        plugins: [verticalHoverPlugin]
      });
  
    } catch (err) {
      console.error("Error loading chart:", err);
    }
  }
  

async function fetchDetails(symbol) {
  try {
    const res1 = await fetch("https://stocksapi-uhe1.onrender.com/api/stocks/getstockstatsdata");
    const statsData = (await res1.json()).stocksStatsData[0][symbol];

    const res2 = await fetch("https://stocksapi-uhe1.onrender.com/api/stocks/getstocksprofiledata");
    const profileData = (await res2.json()).stocksProfileData[0][symbol];

    document.getElementById("stockDetails").innerHTML = `
      <h3>${symbol}</h3>
      <p><strong>Profit:</strong> ${(statsData.profit * 100).toFixed(2)}%</p>
      <p><strong>Book Value:</strong> $${statsData.bookValue}</p>
      <p>${profileData.summary}</p>
    `;
  } catch (err) {
    console.error("Error loading stock details:", err);
  }
}

document.querySelectorAll("button[data-period]").forEach(btn => {
  btn.addEventListener("click", () => {
    currentPeriod = btn.getAttribute("data-period");
    fetchChart(currentSymbol, currentPeriod);
  });
});
