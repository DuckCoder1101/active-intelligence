interface UserAvatarProps {
  name: string | null | undefined;
  photoUrl: string | null | undefined;
  /** Classes do wrapper (tamanho, bg fallback, etc.) */
  className?: string;
  /** Tamanho do texto das iniciais */
  initialsClassName?: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function UserAvatar({ name, photoUrl, className = '', initialsClassName = '' }: UserAvatarProps) {
  const initials = name ? getInitials(name) : '?';

  return (
    <div className={`overflow-hidden rounded-full ${className}`}>
      {photoUrl ? (
        <img src={photoUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span className={`font-black text-white ${initialsClassName}`}>{initials}</span>
        </div>
      )}
    </div>
  );
}
