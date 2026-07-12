import Tag from './Tag';
import { badgesFor, badgeText } from '../../lib/badges';
import type { Badge, BadgeContext, Spot } from '../../types/data';

interface BadgesProps {
  spot: Spot;
  context: BadgeContext;
  badges: Badge[];
}

// spot に対して context（popup/list/detail）に該当する CSV 駆動バッジを並べる。
export default function Badges({ spot, context, badges }: BadgesProps) {
  const matched = badgesFor(badges, spot, context);
  return (
    <>
      {matched.map((b, i) => (
        <Tag key={`${b.field}-${b.value}-${i}`} className={b.class}>
          {badgeText(b, spot)}
        </Tag>
      ))}
    </>
  );
}
