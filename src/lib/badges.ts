// 条件バッジ（BADGES/CSV駆動）
// badges.csv の各行は field/value が一致し、contexts に指定コンテキスト
// （'popup' | 'list' | 'detail'）を含む場合のみ表示対象になる。
// これにより新しい条件バッジ（例: 新エリア限定の注意書き）を
// CSV に1行追加するだけで増やせる。
import { formatEpisodeToken } from './format';
import type { Badge, BadgeContext, Spot } from '../types/data';

function badgeFieldMatches(badge: Badge, s: Spot): boolean {
  const v = s[badge.field];
  if (typeof v === 'boolean') return String(v) === badge.value;
  return v === badge.value;
}

export function badgesFor(badges: Badge[], s: Spot, context: BadgeContext): Badge[] {
  return badges.filter((b) => b.contexts.includes(context) && badgeFieldMatches(b, s));
}

export function badgeText(badge: Badge, s: Spot): string {
  const note = s.statusNote;
  if (badge.noteMode === 'replace') return badge.prefix + (note || badge.label);
  if (badge.noteMode === 'append') return badge.prefix + badge.label + ' — ' + (note || '');
  // アニメバッジは登場話数をバッジ内に埋め込む: 📺 アニメ(1話,7話,OP,ED)
  if (badge.field === 'srcAnime' && s.episodes && s.episodes.length > 0) {
    return badge.prefix + badge.label + '(' + s.episodes.map(formatEpisodeToken).join(',') + ')';
  }
  return badge.prefix + badge.label;
}
