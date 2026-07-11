-- Loveprofile.Ai — Expanded adaptive question bank
-- Adds missing dimensions and 3 sibling questions per dimension, per path.

alter table public.assessment_profiles
  add column if not exists friendship_score numeric not null default 0,
  add column if not exists commitment_score numeric not null default 0,
  add column if not exists reciprocity_score numeric not null default 0;

-- Each concept becomes one question for each assessment path.
-- The three priority tiers give the selector meaningful sibling choices.
with concepts (
  suffix,
  category,
  dimension,
  secondary_dimension,
  priority,
  weight,
  confidence_value,
  rule_tier,
  self_text,
  other_text
) as (
  values
  -- Love
  ('love_acceptance', 'love', 'love', 'emotional_attraction', 84, 1.25, 0.13, 1,
   'How deeply do you accept this person as they are, including their flaws?',
   'How consistently do they seem to accept you as you are, including your flaws?'),
  ('love_care', 'love', 'love', 'attachment', 76, 1.15, 0.12, 2,
   'How strongly do you care about their wellbeing even when you gain nothing from it?',
   'How strongly do they care about your wellbeing when they gain nothing from it?'),
  ('love_stability', 'love', 'love', 'commitment', 68, 1.10, 0.11, 3,
   'How steady do your feelings remain after conflict, distance, or disappointment?',
   'How steady do their feelings seem after conflict, distance, or disappointment?'),

  -- Crush
  ('crush_anticipation', 'crush', 'crush', 'physical_attraction', 84, 1.10, 0.12, 1,
   'How much anticipation or nervous excitement do you feel before seeing them?',
   'How much anticipation or nervous excitement do they show before seeing you?'),
  ('crush_idealization', 'crush', 'crush', 'love', 76, 1.00, 0.11, 2,
   'How often do you catch yourself idealizing them or replaying small moments?',
   'How often do they seem to idealize you or replay small moments you shared?'),
  ('crush_novelty', 'crush', 'crush', 'friendship', 68, 0.95, 0.10, 3,
   'How much of your attraction depends on novelty, mystery, or uncertainty?',
   'How much of their interest seems driven by novelty, mystery, or uncertainty?'),

  -- Friendship
  ('friendship_enjoyment', 'friendship', 'friendship', 'communication', 84, 1.15, 0.12, 1,
   'How much do you enjoy ordinary, non-romantic time with them?',
   'How much do they enjoy ordinary, non-romantic time with you?'),
  ('friendship_authenticity', 'friendship', 'friendship', 'trust', 76, 1.15, 0.12, 2,
   'How fully can you be yourself around them without trying to impress them?',
   'How fully do they seem able to be themselves around you?'),
  ('friendship_respect', 'friendship', 'friendship', 'reciprocity', 68, 1.05, 0.11, 3,
   'How much do you respect their opinions, boundaries, and individuality?',
   'How much do they respect your opinions, boundaries, and individuality?'),

  -- Trust
  ('trust_reliability', 'trust', 'trust', 'commitment', 84, 1.30, 0.14, 1,
   'How confident are you that they will do what they say they will do?',
   'How consistently do their actions match what they promise you?'),
  ('trust_vulnerability', 'trust', 'trust', 'emotional_attraction', 76, 1.25, 0.13, 2,
   'How safe do you feel sharing something vulnerable or embarrassing with them?',
   'How safe do they make it for you to share something vulnerable or embarrassing?'),
  ('trust_conflict', 'trust', 'trust', 'communication', 68, 1.20, 0.12, 3,
   'How much do you trust them to handle conflict without manipulation or punishment?',
   'How well do they handle conflict without manipulation, withdrawal, or punishment?'),

  -- Attachment
  ('attachment_comfort', 'attachment', 'attachment', 'emotional_attraction', 84, 1.20, 0.13, 1,
   'How much emotional comfort do you seek from them when life feels difficult?',
   'How often do they seek emotional comfort from you when life feels difficult?'),
  ('attachment_separation', 'attachment', 'attachment', 'jealousy', 76, 1.10, 0.12, 2,
   'How emotionally unsettled do you become when contact suddenly decreases?',
   'How emotionally unsettled do they seem when contact with you decreases?'),
  ('attachment_security', 'attachment', 'attachment', 'trust', 68, 1.20, 0.12, 3,
   'How secure does your bond feel without constant reassurance?',
   'How secure do they seem in your bond without needing constant reassurance?'),

  -- Commitment
  ('commitment_effort', 'commitment', 'commitment', 'reciprocity', 84, 1.30, 0.14, 1,
   'How willing are you to make sustained effort when this relationship becomes inconvenient?',
   'How willing are they to make sustained effort when the relationship becomes inconvenient?'),
  ('commitment_choice', 'commitment', 'commitment', 'love', 76, 1.25, 0.13, 2,
   'How strongly would you choose this relationship after the initial excitement fades?',
   'How strongly do their actions suggest they would choose this relationship after excitement fades?'),
  ('commitment_repair', 'commitment', 'commitment', 'communication', 68, 1.20, 0.12, 3,
   'How willing are you to repair the connection after a serious misunderstanding?',
   'How willing are they to repair the connection after a serious misunderstanding?'),

  -- Communication
  ('communication_listening', 'communication', 'communication', 'reciprocity', 84, 1.20, 0.13, 1,
   'How well do you listen to understand them rather than simply waiting to respond?',
   'How well do they listen to understand you rather than simply waiting to respond?'),
  ('communication_needs', 'communication', 'communication', 'trust', 76, 1.20, 0.12, 2,
   'How directly can you express your needs without hints, tests, or withdrawal?',
   'How directly do they express their needs without hints, tests, or withdrawal?'),
  ('communication_repair', 'communication', 'communication', 'commitment', 68, 1.15, 0.12, 3,
   'How effectively do you both return to a difficult topic and reach understanding?',
   'How effectively do they return to difficult topics and work toward understanding?'),

  -- Future orientation
  ('future_inclusion', 'future', 'future', 'commitment', 84, 1.25, 0.13, 1,
   'How naturally do you include them when imagining your life one or two years ahead?',
   'How naturally do they include you when talking about life one or two years ahead?'),
  ('future_compatibility', 'future', 'future', 'love', 76, 1.20, 0.12, 2,
   'How compatible do your values, goals, and preferred lifestyles appear?',
   'How seriously do they explore whether your values, goals, and lifestyles fit?'),
  ('future_sacrifice', 'future', 'future', 'commitment', 68, 1.15, 0.11, 3,
   'How willing would you be to adjust meaningful plans to build a shared future?',
   'How willing do they seem to adjust meaningful plans to build a shared future?'),

  -- Physical attraction
  ('physical_presence', 'attraction', 'physical_attraction', 'crush', 84, 1.05, 0.12, 1,
   'How strongly are you drawn to their physical presence when you are together?',
   'How strongly do their body language and attention suggest physical attraction to you?'),
  ('physical_affection', 'attraction', 'physical_attraction', 'emotional_attraction', 76, 1.00, 0.11, 2,
   'How much do you desire comfortable, affectionate physical closeness with them?',
   'How often do they seek comfortable, affectionate physical closeness with you?'),
  ('physical_without_novelty', 'attraction', 'physical_attraction', 'love', 68, 0.95, 0.10, 3,
   'How strong would the physical attraction remain without flirting or novelty?',
   'How consistent is their physical interest outside flirtatious or exciting moments?'),

  -- Emotional attraction
  ('emotional_curiosity', 'attraction', 'emotional_attraction', 'friendship', 84, 1.25, 0.13, 1,
   'How curious are you about their inner world, fears, hopes, and contradictions?',
   'How curious are they about your inner world, fears, hopes, and contradictions?'),
  ('emotional_seen', 'attraction', 'emotional_attraction', 'trust', 76, 1.25, 0.13, 2,
   'How deeply do you feel seen and understood by them?',
   'How much effort do they make to see and understand you beneath the surface?'),
  ('emotional_depth', 'attraction', 'emotional_attraction', 'love', 68, 1.20, 0.12, 3,
   'How meaningful are your conversations when romance or flirting is removed?',
   'How meaningful are their conversations with you when romance or flirting is removed?'),

  -- Jealousy
  ('jealousy_trigger', 'jealousy', 'jealousy', 'attachment', 84, 1.00, 0.11, 1,
   'How strongly are you affected when someone else receives their attention?',
   'How strongly do they react when someone else receives your attention?'),
  ('jealousy_regulation', 'jealousy', 'jealousy', 'trust', 76, 1.05, 0.11, 2,
   'How well can you manage jealousy without controlling or testing them?',
   'How well do they manage jealousy without controlling or testing you?'),
  ('jealousy_source', 'jealousy', 'jealousy', 'trust', 68, 1.00, 0.10, 3,
   'How much of your jealousy comes from unclear behavior rather than insecurity alone?',
   'How much of their jealousy appears driven by unclear signals rather than insecurity alone?'),

  -- Reciprocity
  ('reciprocity_initiative', 'reciprocity', 'reciprocity', 'communication', 84, 1.25, 0.13, 1,
   'How balanced is the effort to initiate contact, plans, and affection?',
   'How balanced is their effort to initiate contact, plans, and affection with yours?'),
  ('reciprocity_support', 'reciprocity', 'reciprocity', 'trust', 76, 1.25, 0.13, 2,
   'How equally do you both provide emotional support and practical care?',
   'How equally do they return the emotional support and practical care you give?'),
  ('reciprocity_priority', 'reciprocity', 'reciprocity', 'commitment', 68, 1.20, 0.12, 3,
   'How balanced is the willingness to make time and compromises for one another?',
   'How consistently do they match your willingness to make time and compromises?')
),
paths (path, prefix) as (
  values
    ('do_i_love_someone', 'dls'),
    ('does_someone_love_me', 'dsl')
),
expanded as (
  select
    prefix || '_x_' || suffix as id,
    path,
    category,
    case when path = 'do_i_love_someone' then self_text else other_text end as question_text,
    'slider' as type,
    '{"min":1,"max":10}'::jsonb as options,
    dimension as psychological_dimension,
    weight,
    priority,
    case rule_tier
      when 1 then jsonb_build_object(
        'only_if', jsonb_build_array(jsonb_build_object(
          'type', 'dimension_uncertain', 'dimension', dimension, 'below', 0.82
        ))
      )
      when 2 then jsonb_build_object(
        'only_if', jsonb_build_array(jsonb_build_object(
          'type', 'dimension_uncertain', 'dimension', dimension, 'below', 0.68
        ))
      )
      else jsonb_build_object(
        'only_if', jsonb_build_array(jsonb_build_object(
          'type', 'dimension_uncertain', 'dimension', dimension, 'below', 0.78
        )),
        'skip_if', jsonb_build_array(jsonb_build_object(
          'type', 'dimension_above', 'dimension', dimension, 'threshold', 88
        ))
      )
    end as follow_up_rules,
    jsonb_build_object(
      'slider', jsonb_build_object(
        'scale',
        jsonb_build_object(dimension, 2.6) ||
          case
            when secondary_dimension is null then '{}'::jsonb
            else jsonb_build_object(secondary_dimension, 0.9)
          end,
        'confidence', confidence_value
      )
    ) as scoring,
    confidence_value
  from concepts
  cross join paths
)
insert into public.questions (
  id,
  path,
  category,
  question_text,
  type,
  options,
  psychological_dimension,
  weight,
  priority,
  follow_up_rules,
  scoring,
  confidence_value
)
select
  id,
  path,
  category,
  question_text,
  type,
  options,
  psychological_dimension,
  weight,
  priority,
  follow_up_rules,
  scoring,
  confidence_value
from expanded
on conflict (id) do update set
  category = excluded.category,
  question_text = excluded.question_text,
  options = excluded.options,
  psychological_dimension = excluded.psychological_dimension,
  weight = excluded.weight,
  priority = excluded.priority,
  follow_up_rules = excluded.follow_up_rules,
  scoring = excluded.scoring,
  confidence_value = excluded.confidence_value,
  is_active = true;

-- Conflict-only tie breakers. These remain ineligible until the score gap exists.
with tie_breakers (
  suffix,
  category,
  target_dimension,
  high_dimension,
  low_dimension,
  gap,
  priority,
  self_text,
  other_text,
  scoring
) as (
  values
  ('spark_vs_depth', 'tie_breaker', 'emotional_attraction', 'physical_attraction', 'emotional_attraction', 22, 97,
   'If the physical spark faded, how much emotional connection would remain?',
   'When physical chemistry is set aside, how much emotional depth do they still show?',
   '{"slider":{"scale":{"emotional_attraction":3.2,"love":1.1},"confidence":0.16}}'::jsonb),
  ('bond_vs_commitment', 'tie_breaker', 'commitment', 'attachment', 'commitment', 22, 96,
   'Does feeling attached make you want to build something stable, or mainly avoid losing them?',
   'Does their attachment lead to stable choices, or mainly fear of losing contact?',
   '{"slider":{"scale":{"commitment":3.0,"attachment":0.8},"confidence":0.16}}'::jsonb),
  ('love_vs_trust', 'tie_breaker', 'trust', 'love', 'trust', 22, 95,
   'Can your strong feelings coexist with genuine trust in their character and intentions?',
   'Do their strong feelings come with behavior that makes them genuinely trustworthy?',
   '{"slider":{"scale":{"trust":3.2,"love":0.7},"confidence":0.16}}'::jsonb),
  ('talk_vs_reciprocity', 'tie_breaker', 'reciprocity', 'communication', 'reciprocity', 20, 94,
   'Do good conversations translate into equal effort outside those conversations?',
   'Does their warm communication translate into effort that matches yours?',
   '{"slider":{"scale":{"reciprocity":3.1,"communication":0.7},"confidence":0.15}}'::jsonb),
  ('jealousy_vs_trust', 'tie_breaker', 'trust', 'jealousy', 'trust', 20, 93,
   'When jealousy appears, how much can you still choose trust over checking or controlling?',
   'When they become jealous, how much do they still choose trust over checking or controlling?',
   '{"slider":{"scale":{"trust":2.8,"jealousy":-1.2},"confidence":0.15}}'::jsonb),
  ('crush_vs_future', 'tie_breaker', 'future', 'crush', 'future', 22, 92,
   'Beyond excitement, how realistically would your lives fit together long term?',
   'Beyond excitement, how realistically do they behave as if your lives could fit long term?',
   '{"slider":{"scale":{"future":3.0,"commitment":1.0},"confidence":0.15}}'::jsonb)
),
paths (path, prefix) as (
  values
    ('do_i_love_someone', 'dls'),
    ('does_someone_love_me', 'dsl')
)
insert into public.questions (
  id,
  path,
  category,
  question_text,
  type,
  options,
  psychological_dimension,
  weight,
  priority,
  follow_up_rules,
  scoring,
  confidence_value
)
select
  prefix || '_tb_' || suffix,
  path,
  category,
  case when path = 'do_i_love_someone' then self_text else other_text end,
  'slider',
  '{"min":1,"max":10}'::jsonb,
  target_dimension,
  1.35,
  priority,
  jsonb_build_object(
    'only_if', jsonb_build_array(
      jsonb_build_object(
        'type', 'dimension_gap',
        'high', high_dimension,
        'low', low_dimension,
        'gap', gap
      )
    )
  ),
  scoring,
  0.16
from tie_breakers
cross join paths
on conflict (id) do update set
  question_text = excluded.question_text,
  priority = excluded.priority,
  follow_up_rules = excluded.follow_up_rules,
  scoring = excluded.scoring,
  confidence_value = excluded.confidence_value,
  is_active = true;

-- Validation: each path should now have at least four choices per dimension
-- when combined with the original migration 003 seeds.
select
  path,
  psychological_dimension,
  count(*) as active_question_count
from public.questions
where is_active = true
group by path, psychological_dimension
order by path, psychological_dimension;
