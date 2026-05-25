interface EmptyStateProps {
  icon: string;
  message: string;
}

export default function EmptyState({ icon, message }: EmptyStateProps) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '64px 20px',
        color: 'var(--text-secondary)',
        fontSize: 15,
      }}
    >
      <span aria-hidden="true">{icon}</span> {message}
    </div>
  );
}
