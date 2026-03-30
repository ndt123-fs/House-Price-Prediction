import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";

// 1. Cấu trúc lại CHART_DATA (Bỏ val cố định, chỉ giữ khung khoảng giá)
const CHART_DATA = [
  { range: "200$", min: 0, max: 200000 },
  { range: "200$-400$", min: 200000, max: 400000 },
  { range: "400$-600$", min: 400000, max: 600000 },
  { range: "600$-800$", min: 600000, max: 800000 },
  { range: "800$-1000$", min: 800000, max: 1000000 },
  { range: ">1000$", min: 1000000, max: Infinity },
];

const FIELDS = [
  { name: "bedrooms", label: "Phòng ngủ", type: "int" },
  { name: "bathrooms", label: "Phòng tắm", type: "float" },
  { name: "sqft_living", label: "Diện tích sống (sqft)", type: "int" },
  { name: "floors", label: "Số tầng", type: "float" },
  { name: "waterfront", label: "View mặt nước (0/1)", type: "int" },
  { name: "view", label: "Điểm view (0–4)", type: "int" },
  { name: "grade", label: "Chất lượng (1–13)", type: "int" },
  { name: "sqft_above", label: "DT trên mặt đất (sqft)", type: "int" },
  { name: "sqft_basement", label: "DT tầng hầm (sqft)", type: "int" },
  { name: "yr_built", label: "Năm xây dựng", type: "int" },
  { name: "yr_renovated", label: "Năm cải tạo (0 nếu chưa)", type: "int" },
  { name: "lat", label: "Vĩ độ (latitude)", type: "float" },
  { name: "sqft_living15", label: "DT sống lân cận (sqft)", type: "int" },
  { name: "years", label: "Tuổi nhà (năm)", type: "int" },
];

export default function App() {
  const [form, setForm] = useState(
    Object.fromEntries(FIELDS.map((f) => [f.name, ""])),
  );
  const [result, setResult] = useState(null); // Để null ban đầu cho đến khi dự đoán
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // GIẢ LẬP: Hàm xử lý dự đoán (Khi bạn bấm nút, result sẽ thay đổi)
  const handlePredict = () => {
    setLoading(true);
    // Giả lập lấy kết quả từ backend sau 1s
    setTimeout(() => {
      // Ví dụ: Random một số từ 100k đến 1.2tr
      const mockPrice = Math.floor(Math.random() * 1100000) + 100000;
      setResult(mockPrice);
      setLoading(false);
    }, 800);
  };

  // 2. LOGIC QUAN TRỌNG: Tạo dữ liệu biểu đồ dựa trên 'result' hiện tại
  const dynamicChartData = CHART_DATA.map((item) => {
    const isActive = result >= item.min && result < item.max;
    return {
      ...item,
      // Nếu đúng khoảng thì cột cao lên (80), sai khoảng thì thấp xuống (5) hoặc (0)
      val: isActive ? 80 : 5,
    };
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "40px 20px",
        fontFamily: "'Inter', sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <h1
          style={{ color: "white", fontSize: 32, margin: 0, fontWeight: 800 }}
        >
          🏠 Dự đoán giá nhà
        </h1>
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 1100,
          display: "flex",
          flexDirection: "row",
          gap: "20px",
          alignItems: "stretch",
          justifyContent: "center",
        }}
      >
        {/* CỘT TRÁI: FORM */}
        <div
          style={{
            flex: "3",
            background: "white",
            borderRadius: 20,
            padding: "30px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px 20px",
            }}
          >
            {FIELDS.map(({ name, label }) => (
              <div key={name}>
                <label
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#9ca3af",
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: 5,
                    textAlign: "center",
                  }}
                >
                  {label}
                </label>
                <input
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  type="number"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: 20,
                    textAlign: "center",
                    outline: "none",
                  }}
                />
              </div>
            ))}
          </div>

          <button
            onClick={handlePredict}
            style={{
              marginTop: 25,
              width: "100%",
              padding: "14px",
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              color: "white",
              border: "none",
              borderRadius: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {loading ? "⌛ Đang tính toán..." : "● Dự đoán giá"}
          </button>
        </div>

        {/* CỘT PHẢI: RESULT */}
        <div
          style={{
            flex: "2",
            background: "white",
            borderRadius: 20,
            padding: "30px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#6b7280", fontSize: 12, fontWeight: 700 }}>
              GIÁ DỰ ĐOÁN
            </p>
            <h2
              style={{
                fontSize: 36,
                fontWeight: 800,
                color: "#7c3aed",
                margin: "10px 0",
              }}
            >
              {result ? `$${result.toLocaleString("en-US")}` : "---"}
            </h2>
            <p style={{ fontSize: 11, color: "#9ca3af" }}>
              📊 Phân khúc giá thị trường
            </p>
          </div>

          <div style={{ width: "100%", height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              {/* SỬ DỤNG dynamicChartData THAY VÌ CHART_DATA GỐC */}
              <BarChart data={dynamicChartData}>
                <XAxis
                  dataKey="range"
                  tick={{ fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide domain={[0, 100]} />
                <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                  {dynamicChartData.map((entry, index) => (
                    <Cell
                      key={index}
                      // Highlight màu xám đậm cho cột active, xám nhạt cho cột còn lại
                      fill={
                        result >= entry.min && result < entry.max
                          ? "#d1d5db"
                          : "#f3f4f6"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div
            style={{
              background: "#f5f3ff",
              padding: 15,
              borderRadius: 12,
              textAlign: "center",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: "#7c3aed",
                fontWeight: 700,
              }}
            >
              💡 Phân tích nhanh
            </p>
            <p style={{ margin: "5px 0 0", fontSize: 12, color: "#6b7280" }}>
              {result
                ? result < 500000
                  ? "Phân khúc bình dân."
                  : "Phân khúc cao cấp tại King County."
                : "Nhập dữ liệu để xem phân tích."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
