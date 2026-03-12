"use client";

import { User } from "@/lib/data/users";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserSelectorProps {
  readonly users: User[];
  readonly selectedUserId: string | null;
  readonly onSelect: (userId: string) => void;
}

export function UserSelector({ users, selectedUserId, onSelect }: UserSelectorProps) {
  return (
    <Select value={selectedUserId || undefined} onValueChange={(val) => { if (val) onSelect(val); }}>
      <SelectTrigger
        id="user-selector"
        className="w-full md:w-[320px] h-12 bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all duration-300"
      >
        <SelectValue placeholder="👤 Select a user to get started..." />
      </SelectTrigger>
      <SelectContent className="bg-card/95 backdrop-blur-xl border-border/50">
        {users.map((user) => (
          <SelectItem
            key={user.id}
            value={user.id}
            className="cursor-pointer hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-3 py-1">
              <span className="text-2xl">{user.avatar}</span>
              <div>
                <p className="font-semibold text-foreground">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.persona}</p>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
