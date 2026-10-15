import { Box, BriefcaseBusiness, House, Mail, Trophy, UserRound, type LucideIcon, type LucideProps } from 'lucide-react';
import type { LandmarkIcon as IconId } from '../landmarks';

const icons: Record<IconId, LucideIcon> = {
  home: House,
  user: UserRound,
  box: Box,
  briefcase: BriefcaseBusiness,
  trophy: Trophy,
  mail: Mail,
};

export function LandmarkIcon({ icon, ...props }: { icon: IconId } & LucideProps) {
  const Icon = icons[icon];
  return <Icon aria-hidden {...props} />;
}
