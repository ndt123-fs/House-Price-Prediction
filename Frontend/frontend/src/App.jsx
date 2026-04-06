import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis,
  Tooltip, Cell, ResponsiveContainer,
} from "recharts";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const CHART_DATA = [
  { range: "<$200K",    min: 0,       max: 200000  },
  { range: "$200-400K", min: 200000,  max: 400000  },
  { range: "$400-600K", min: 400000,  max: 600000  },
  { range: "$600-800K", min: 600000,  max: 800000  },
  { range: "$800K-1M",  min: 800000,  max: 1000000 },
  { range: ">$1M",      min: 1000000, max: Infinity },
];

const FIELDS = [
  { name: "bedrooms",      label: "Phòng ngủ"                },
  { name: "bathrooms",     label: "Phòng tắm"                },
  { name: "sqft_living",   label: "Diện tích sống (sqft)"    },
  { name: "floors",        label: "Số tầng"                   },
  { name: "waterfront",    label: "View mặt nước (0/1)"      },
  { name: "view",          label: "Điểm view (0–4)"          },
  { name: "grade",         label: "Chất lượng (1–13)"        },
  { name: "sqft_above",    label: "DT trên mặt đất (sqft)"   },
  { name: "sqft_basement", label: "DT tầng hầm (sqft)"       },
  { name: "yr_built",      label: "Năm xây dựng"             },
  { name: "yr_renovated",  label: "Năm cải tạo (0 nếu chưa)" },
  { name: "lat",           label: "Vĩ độ (latitude)"         },
  { name: "sqft_living15", label: "DT sống lân cận (sqft)"   },
  { name: "years",         label: "Tuổi nhà (năm)"           },
];

// Các field tóm tắt hiển thị trong history card
const SUMMARY_FIELDS = [
  { name: "bedrooms",    label: "Phòng ngủ"  },
  { name: "bathrooms",   label: "Phòng tắm"  },
  { name: "sqft_living", label: "Diện tích"  },
  { name: "grade",       label: "Chất lượng" },
  { name: "yr_built",    label: "Năm xây"    },
];

function getAnalysis(result) {
  if (result === null)   return "Nhập dữ liệu để xem phân tích.";
  if (result < 300000)  return "Phân khúc bình dân, phù hợp người mua lần đầu.";
  if (result < 600000)  return "Phân khúc trung cấp tại King County.";
  if (result < 1000000) return "Phân khúc cao cấp tại King County.";
  return "Phân khúc luxury — top 10% thị trường.";
}

function formatTime(date) {
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function App() {
  const [form, setForm]       = useState(Object.fromEntries(FIELDS.map((f) => [f.name, ""])));
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [history, setHistory] = useState([]); // tối đa 3 mục

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handlePredict = async () => {
    setError(null);

    const emptyFields = FIELDS.filter((f) => form[f.name] === "");
    if (emptyFields.length > 0) {
      setError(`Vui lòng nhập đủ: ${emptyFields.map((f) => f.label).join(", ")}`);
      return;
    }

    try {
      setLoading(true);
      const payload = Object.fromEntries(
        FIELDS.map((f) => [f.name, Number(form[f.name])])
      );

      const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`Server lỗi: ${response.status}`);

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const predicted = data.predicted_price;
      setResult(predicted);

      // Thêm vào history, giữ tối đa 3 mục gần nhất
      const newEntry = {
        id:        Date.now(),
        time:      formatTime(new Date()),
        price:     predicted,
        inputs:    { ...payload },
      };
      setHistory((prev) => [newEntry, ...prev].slice(0, 3));

    } catch (err) {
      setError("Không thể kết nối server. Vui lòng thử lại.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const chartData = CHART_DATA.map((item) => ({
    ...item,
    val: result !== null && result >= item.min && result < item.max ? 80 : 5,
  }));

  return (
    <div className="app">
      {/* Header */}
      <header className="app__header">
        <h1 className="app__title">🏠 Dự đoán giá nhà</h1>
        <p className="app__subtitle">King County House Price Prediction</p>
      </header>

      <div className="app__content">
        {/* Cột trái: Form */}
        <div className="card card--form">
          <h3 className="form__heading">Nhập thông tin nhà</h3>

          <div className="form__grid">
            {FIELDS.map(({ name, label }) => (
              <div key={name} className="form__field">
                <label className="form__label">{label}</label>
                <input
                  className={`form__input${error && form[name] === "" ? " form__input--error" : ""}`}
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  type="number"
                  placeholder="0"
                />
              </div>
            ))}
          </div>

          {error && <p className="form__error">⚠ {error}</p>}

          <button
            className="btn-predict"
            onClick={handlePredict}
            disabled={loading}
          >
            {loading ? "⌛ Đang tính toán..." : "● Dự đoán giá"}
          </button>
        </div>

        {/* Cột phải: Result */}
        <div className="card card--result">
          <div>
            <p className="result__label">Giá dự đoán</p>
            <p className={`result__price ${result ? "result__price--active" : "result__price--empty"}`}>
              {result ? `$${result.toLocaleString("en-US")}` : "---"}
            </p>
            <p className="result__chart-label">📊 Phân khúc giá thị trường</p>
          </div>

          <div className="result__chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, bottom: 0 }}>
                <XAxis
                  dataKey="range"
                  tick={{ fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide domain={[0, 100]} />
                <Tooltip
                  formatter={() => null}
                  labelFormatter={(label) => `Phân khúc: ${label}`}
                  contentStyle={{ fontSize: 11 }}
                />
                <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={
                        result !== null && result >= entry.min && result < entry.max
                          ? "#6d4aff"
                          : "#f3f4f6"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="result__analysis">
            <p className="result__analysis-title">💡 Phân tích nhanh</p>
            <p className="result__analysis-text">{getAnalysis(result)}</p>
          </div>
        </div>
      </div>

      {/* History section */}
      {history.length > 0 && (
        <div className="history">
          <div className="history__header">
            <h3 className="history__title">🕓 Lịch sử dự đoán</h3>
            <span className="history__count">{history.length} / 3</span>
          </div>

          <div className="history__list">
            {history.map((entry, index) => (
              <div
                key={entry.id}
                className={`history__card ${index === 0 ? "history__card--latest" : ""}`}
              >
                {index === 0 && (
                  <span className="history__badge">Mới nhất</span>
                )}

                <div className="history__price">
                  ${entry.price.toLocaleString("en-US")}
                </div>

                <div className="history__time">🕐 {entry.time}</div>

                <div className="history__divider" />

                <div className="history__fields">
                  {SUMMARY_FIELDS.map(({ name, label }) => (
                    <div key={name} className="history__field">
                      <span className="history__field-label">{label}</span>
                      <span className="history__field-value">{entry.inputs[name]}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}