-- Refresh experience list with eight test roles and richer descriptions
UPDATE public.experience_entries
SET deleted_at = now()
WHERE deleted_at IS NULL;

INSERT INTO public.experience_entries
  (title, org, date_label, description, sort_order)
VALUES
  (
    'Senior Art Director',
    'SingularityKSA',
    '2021',
    'Once upon a time, in a vibrant city of ancient wonder and modern ambition, there lived a graphic designer named Galil. He shaped brand worlds for campaigns that needed craft, patience, and a stubborn eye for detail.',
    1
  ),
  (
    'Design Lead',
    'Imagineer Studio',
    '2022',
    'Leading a small studio team across identity, motion, and product stories — from first sketch to final frame. Mentoring designers while keeping the work sharp, warm, and unmistakably human.',
    2
  ),
  (
    'Senior Product Designer',
    'Studio North',
    '2019',
    'Built product systems and marketing surfaces for growth teams. Pairing research with cinematic visual language so interfaces felt as considered as the films around them.',
    3
  ),
  (
    'Brand Designer',
    'Independent',
    '2016',
    'Freelance brand and campaign work across Cairo and Riyadh — logos, type, packaging, and short-form films for founders who wanted their story told with clarity and taste.',
    4
  ),
  (
    'Art Director',
    'Orbit Studio',
    '2018',
    'Directed multi-format campaigns spanning print, social, and film. Coordinating illustrators, editors, and producers to keep every touchpoint speaking the same visual dialect.',
    5
  ),
  (
    'Motion Designer',
    'Field Office',
    '2014',
    'Crafted title sequences, product reveals, and brand films with a focus on pacing, texture, and light. Turning still concepts into sequences that hold attention without noise.',
    6
  ),
  (
    'Visual Designer',
    'Tide Agency',
    '2012',
    'Supported senior directors on large retail and entertainment briefs. Learning the discipline of grids, hierarchy, and how a single image can carry an entire narrative.',
    7
  ),
  (
    'Design Intern',
    'Studio Cairo',
    '2011',
    'First seat in a working studio — production files, mockups, and late-night revisions. Discovering that craft is less about inspiration and more about returning to the work every day.',
    8
  );
