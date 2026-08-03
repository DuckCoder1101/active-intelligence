import { MdStar, MdStarBorder } from 'react-icons/md';

type StarRatingProps = {
  value: number;
  onChange: (value: number) => void;
};

const STARS = [1, 2, 3, 4, 5];

export function StarRating({ value, onChange }: StarRatingProps) {
  return (
    <div className="flex gap-1">
      {STARS.map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          aria-label={`${star} estrela${star > 1 ? 's' : ''}`}
          className="text-orange transition-transform hover:scale-110"
        >
          {star <= value ? <MdStar size={32} /> : <MdStarBorder size={32} />}
        </button>
      ))}
    </div>
  );
}
