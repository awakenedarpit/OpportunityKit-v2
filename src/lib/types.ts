export type Opportunity = {
  id: string; title: string; organization: string; category: string; type: string;
  location: string; mode: string; deadline: string | null; url: string; description: string;
  eligibility: string[]; skills: string[]; source: string; created_at?: string;
  stipend?: string | null; featured?: boolean; tags?: string[];
};
