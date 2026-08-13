function Badge({ status }) {
  const colors = {
    pending: "#f59e0b",
    verified: "#22c55e",
    rejected: "#ef4444",
  };

  return (
    <span
      style={{
        background: colors[status] || "#94a3b8",
        color: "#fff",
        padding: "4px 10px",
        borderRadius: "30px",
        fontSize: "12px",
        fontWeight: "600",
        textTransform: "capitalize",
      }}
    >
      {status}
    </span>
  );
}

export default Badge;
