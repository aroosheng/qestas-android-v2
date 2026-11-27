import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
  reviewCount?: number;
}

export function StarRating({ rating, size = 'sm', showNumber = false, reviewCount }: StarRatingProps) {
  const sizes = { sm: 'w-3.5 h-3.5', md: 'w-4 h-4', lg: 'w-6 h-6' };
  const textSize = { sm: 'text-xs', md: 'text-sm', lg: 'text-lg' };
  const s = sizes[size];

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= Math.floor(rating);
          const half = star === Math.ceil(rating) && rating % 1 >= 0.5;
          return (
            <Star
              key={star}
              className={`${s} ${filled || half ? 'text-accent-400 fill-accent-400' : 'text-surface-700'}`}
            />
          );
        })}
      </div>
      {showNumber && (
        <span className={`${textSize[size]} text-surface-300 font-medium mr-1`}>
          {rating.toFixed(1)}
          {reviewCount !== undefined && (
            <span className="text-surface-600 mr-1">({reviewCount})</span>
          )}
        </span>
      )}
    </div>
  );
}

interface SpecialtyBadgeProps {
  name: string;
  variant?: 'main' | 'sub';
}

export function SpecialtyBadge({ name, variant = 'sub' }: SpecialtyBadgeProps) {
  if (variant === 'main') {
    return (
      <span className="inline-flex items-center gap-1.5 bg-accent-600/15 text-accent-400 border border-accent-600/30 px-3 py-1.5 rounded-lg text-xs font-semibold">
        {name}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center bg-surface-800 text-surface-300 border border-surface-700 px-2.5 py-1 rounded-lg text-xs font-medium">
      {name}
    </span>
  );
}

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Avatar({ src, name, size = 'md' }: AvatarProps) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl',
  };
  const s = sizes[size];

  if (src) {
    return <img src={src} alt={name ?? ''} className={`${s} rounded-xl object-cover`} />;
  }

  const initials = name
    ? name.split(' ').slice(0, 2).map((w) => w[0]).join('')
    : '?';

  return (
    <div className={`${s} rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center text-white font-bold`}>
      {initials}
    </div>
  );
}
