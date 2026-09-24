// Safe to edit by hand
// Is a photograph of PEOPLE or of a PLACE? (2026-09-24, the Visit identity
// pass; the rollout rule "arches for people, rectangles for buildings",
// docs/superpowers/plans/2026-09-23-fbcm-identity-rollout.md rule 3.)
//
// Derived, never a field (CLAUDE.md rule 15): the answer is read off the alt
// text the photo already carries, which every image in this schema requires
// and every library photo was given when it was catalogued. A photo whose
// description names a person (a child, the congregation, a bride, "smiling")
// is framed in an arch; anything else (a doorway, the tower, a room) stays a
// rectangle. An empty alt is a place: the safe default, because a rectangle
// never crops a face and an arch sometimes does.
//
// A people word that NAMES A ROOM ("the family room", "the pastor's study",
// "the children's wing", "the party room", "the youth center") is removed
// before the test, so a room is not mistaken for the people it is named after.
//
// Read on the stega-CLEANED text (CLAUDE.md, the preview rules).
import { splitStega } from './preview-stega.ts';

const PEOPLE =
  /\b(?:people|person|persons|man|men|woman|women|lady|ladies|gentleman|girls?|boys?|child|children|kids?|bab(?:y|ies)|newborn|toddlers?|teens?|teenagers?|teenage|youth|famil(?:y|ies)|congregation|choir|couples?|bride|groom|pastors?|ministers?|members?|friends|volunteers|group|crowd|adults?|students?|deacons?|singers?|musicians?|guitarists?|pianist|team|guests?|party|parents?|mother|father|grandparents?|faces?|smil(?:e|es|ing)|laugh(?:s|ing)?|posed?|posing|hugs?|hugging)\b/i;

const ROOM_AFTER =
  /\b(?:people|person|man|men|woman|women|lady|ladies|girls?|boys?|child|children|kids?|bab(?:y|ies)|teens?|youth|famil(?:y|ies)|choir|couples?|bride|groom|pastors?|ministers?|members?|friends|volunteers|group|adults?|students?|deacons?|singers?|musicians?|team|guests?|party|parents?)(?:'s|s'|’s|s’)?\s+(?:room|study|wing|hall|suite|lounge|office|center|centre|building)s?\b/gi;

export type PhotoSubject = 'people' | 'place';

/** 'people' when the description names a person, 'place' otherwise. */
export function photoSubject(alt: string | null | undefined): PhotoSubject {
  const text = splitStega(alt ?? '').cleaned.replace(ROOM_AFTER, ' ');
  return PEOPLE.test(text) ? 'people' : 'place';
}
