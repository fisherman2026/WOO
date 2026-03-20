import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

export type CharacterClass = "ranger" | "hiker" | "naturalist" | "tracker";
export type CharacterGender = "male" | "female";
export type ParkId = "yellowstone" | "grand_teton";

export type QuestStatus = "locked" | "available" | "active" | "completed";
export type QuestType = "gps" | "photo" | "lore" | "explore";

export interface Quest {
  id: string;
  parkId: ParkId;
  title: string;
  description: string;
  type: QuestType;
  class: CharacterClass | "all";
  xpReward: number;
  itemReward?: string;
  status: QuestStatus;
  location?: {
    name: string;
    latitude: number;
    longitude: number;
    radius: number;
  };
  photoTarget?: string;
  loreText?: string;
  completedAt?: string;
}

export interface Park {
  id: ParkId;
  name: string;
  shortName: string;
  state: string;
  tagline: string;
  description: string;
  established: string;
  size: string;
  imageKey: string;
  accentColor: string;
  darkColor: string;
  tags: string[];
  isPremium: boolean;
  price?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  type: "weapon" | "tool" | "lore" | "cosmetic" | "collectible";
  rarity: "common" | "uncommon" | "rare" | "legendary";
  class?: CharacterClass;
  icon: string;
  acquiredAt: string;
}

export interface CharacterProfile {
  id: string;
  name: string;
  class: CharacterClass;
  gender: CharacterGender;
  level: number;
  xp: number;
}

export interface Character {
  id: string;
  name: string;
  class: CharacterClass;
  gender: CharacterGender;
  level: number;
  xp: number;
  xpToNextLevel: number;
  completedQuests: string[];
  inventory: InventoryItem[];
  activeQuests: string[];
  totalPhotos: number;
  totalLocationsVisited: number;
  loreScrollsFound: number;
  createdAt: string;
}

interface GameContextType {
  character: Character | null;
  quests: Quest[];
  activeParkId: ParkId;
  isLoading: boolean;
  allProfiles: CharacterProfile[];
  createCharacter: (name: string, cls: CharacterClass, gender: CharacterGender) => Promise<void>;
  switchToProfile: (id: string) => Promise<void>;
  completeQuest: (questId: string) => Promise<void>;
  addXP: (amount: number) => Promise<void>;
  addItem: (item: InventoryItem) => Promise<void>;
  startQuest: (questId: string) => Promise<void>;
  setActivePark: (parkId: ParkId) => Promise<void>;
  resetGame: () => Promise<void>;
}

const STORAGE_KEY = "@woo_character";
const QUESTS_KEY = "@woo_quests";
const PARK_KEY = "@woo_active_park";
const PROFILES_KEY = "@woo_profiles";
const ACTIVE_ID_KEY = "@woo_active_id";
const charKey  = (id: string) => `@woo_char_${id}`;
const questKey = (id: string) => `@woo_quests_${id}`;
const parkKey  = (id: string) => `@woo_park_${id}`;

const XP_PER_LEVEL = [
  0, 100, 250, 500, 900, 1400, 2000, 2800, 3800, 5000, 6500,
];

function calcLevel(xp: number): { level: number; xpToNext: number } {
  let level = 1;
  for (let i = 1; i < XP_PER_LEVEL.length; i++) {
    if (xp >= XP_PER_LEVEL[i]) {
      level = i + 1;
    } else {
      return { level, xpToNext: XP_PER_LEVEL[i] - xp };
    }
  }
  return { level: XP_PER_LEVEL.length, xpToNext: 0 };
}

export const PARKS: Park[] = [
  {
    id: "yellowstone",
    name: "Yellowstone National Park",
    shortName: "Yellowstone",
    state: "Wyoming",
    tagline: "The World's First National Park",
    description:
      "Home to more than half of the world's geysers, Yellowstone sits atop a massive supervolcano. Wolves, grizzly bears, bison, and eagles roam its 2.2 million acres.",
    established: "1872",
    size: "2.2M acres",
    imageKey: "park_yellowstone",
    accentColor: "#F5A623",
    darkColor: "#7A4E0A",
    tags: ["Geysers", "Wildlife", "Supervolcano", "Free Starter"],
    isPremium: false,
  },
  {
    id: "grand_teton",
    name: "Grand Teton National Park",
    shortName: "Grand Teton",
    state: "Wyoming",
    tagline: "Where Mountains Meet the Sky",
    description:
      "The Teton Range rises abruptly from the valley floor, creating one of the most dramatic mountain landscapes in North America. Crystal lakes, rushing rivers, and abundant wildlife await.",
    established: "1929",
    size: "310K acres",
    imageKey: "park_grand_teton",
    accentColor: "#3B9ECC",
    darkColor: "#1A4A66",
    tags: ["Mountains", "Alpine Lakes", "Wildlife", "Hiking"],
    isPremium: false,
  },
];

const CLASS_STARTING_ITEMS: Record<CharacterClass, InventoryItem> = {
  ranger: {
    id: "ranger_badge",
    name: "Ranger Badge",
    description:
      "A shiny bronze badge marking your authority to protect the park.",
    type: "tool",
    rarity: "uncommon",
    class: "ranger",
    icon: "shield",
    acquiredAt: new Date().toISOString(),
  },
  hiker: {
    id: "trail_compass",
    name: "Trail Compass",
    description: "A reliable compass that never fails in the wild.",
    type: "tool",
    rarity: "common",
    class: "hiker",
    icon: "navigation",
    acquiredAt: new Date().toISOString(),
  },
  naturalist: {
    id: "field_guide",
    name: "Naturalist Field Guide",
    description: "A worn but treasured guide to national park plant life.",
    type: "tool",
    rarity: "uncommon",
    class: "naturalist",
    icon: "book-open",
    acquiredAt: new Date().toISOString(),
  },
  tracker: {
    id: "tracker_spyglass",
    name: "Tracker Spyglass",
    description: "A brass spyglass to spot animals from a safe distance.",
    type: "weapon",
    rarity: "uncommon",
    class: "tracker",
    icon: "eye",
    acquiredAt: new Date().toISOString(),
  },
};

const ALL_QUESTS: Quest[] = [
  // ── YELLOWSTONE ────────────────────────────────────────────────
  // RANGER
  {
    id: "q_ranger_patrol_1",
    parkId: "yellowstone",
    title: "First Patrol Route",
    description:
      "Walk the perimeter of Old Faithful geyser basin to ensure visitor safety.",
    type: "gps",
    class: "ranger",
    xpReward: 75,
    itemReward: "patrol_log",
    status: "available",
    location: {
      name: "Old Faithful Geyser",
      latitude: 44.4605,
      longitude: -110.8281,
      radius: 200,
    },
  },
  {
    id: "q_ranger_wildlife_1",
    parkId: "yellowstone",
    title: "Bison Herd Report",
    description:
      "Document a wild bison herd and estimate their numbers for the park record.",
    type: "photo",
    class: "ranger",
    xpReward: 100,
    itemReward: "wildlife_report",
    status: "available",
    photoTarget: "bison herd",
  },
  {
    id: "q_ranger_lore_1",
    parkId: "yellowstone",
    title: "The 1988 Fires",
    description:
      "Find and read the historical marker about the great 1988 Yellowstone wildfires.",
    type: "lore",
    class: "ranger",
    xpReward: 60,
    status: "available",
    loreText:
      "In 1988, fires burned 793,000 acres — 36% of Yellowstone. Rather than destroying the park, the fires renewed it. Lodgepole pine seeds, sealed in resin cones, only open when exposed to intense heat. Today's forests grew from that fire.",
  },
  {
    id: "q_ranger_protect_1",
    parkId: "yellowstone",
    title: "Thermal Feature Safety",
    description:
      "Locate and photograph a thermal feature with visible safety signage.",
    type: "photo",
    class: "ranger",
    xpReward: 80,
    status: "locked",
    photoTarget: "geothermal pool with warning sign",
  },
  // HIKER
  {
    id: "q_hiker_summit_1",
    parkId: "yellowstone",
    title: "Overlook at Hayden Valley",
    description:
      "Hike to the scenic overlook at Hayden Valley for a panoramic view.",
    type: "gps",
    class: "hiker",
    xpReward: 90,
    itemReward: "vista_token",
    status: "available",
    location: {
      name: "Hayden Valley Overlook",
      latitude: 44.6498,
      longitude: -110.4894,
      radius: 300,
    },
  },
  {
    id: "q_hiker_sunrise_1",
    parkId: "yellowstone",
    title: "Sunrise at Mammoth",
    description:
      "Reach Mammoth Hot Springs terraces at sunrise and photograph the golden light.",
    type: "photo",
    class: "hiker",
    xpReward: 120,
    itemReward: "golden_hour_badge",
    status: "available",
    photoTarget: "Mammoth Hot Springs at sunrise",
  },
  {
    id: "q_hiker_trail_1",
    parkId: "yellowstone",
    title: "Artist Paint Pots Trail",
    description:
      "Complete the Artist Paint Pots trail loop and reach the mud volcano area.",
    type: "gps",
    class: "hiker",
    xpReward: 85,
    status: "available",
    location: {
      name: "Artist Paint Pots",
      latitude: 44.6648,
      longitude: -110.7078,
      radius: 250,
    },
  },
  {
    id: "q_hiker_lore_1",
    parkId: "yellowstone",
    title: "John Colter's Discovery",
    description:
      "Learn the story of the first European to explore what is now Yellowstone.",
    type: "lore",
    class: "hiker",
    xpReward: 50,
    status: "available",
    loreText:
      "John Colter, a member of the Lewis & Clark Expedition, explored the Yellowstone region in 1807-1808. His reports of geysers and boiling pools were so incredible that people called the area 'Colter's Hell' — thinking he was making it all up.",
  },
  // NATURALIST
  {
    id: "q_nat_flower_1",
    parkId: "yellowstone",
    title: "Fireweed Discovery",
    description:
      "Find and photograph fireweed (Epilobium angustifolium) growing near a forest edge.",
    type: "photo",
    class: "naturalist",
    xpReward: 80,
    itemReward: "pressed_fireweed",
    status: "available",
    photoTarget: "fireweed plant with pink-purple flowers",
  },
  {
    id: "q_nat_ecosystem_1",
    parkId: "yellowstone",
    title: "Geothermal Ecosystem",
    description:
      "Observe and photograph the unique microbe mats in a hot spring that make it colorful.",
    type: "photo",
    class: "naturalist",
    xpReward: 110,
    itemReward: "microbe_sample",
    status: "available",
    photoTarget: "colorful hot spring microbe mat",
  },
  {
    id: "q_nat_tree_1",
    parkId: "yellowstone",
    title: "Lodgepole Pine Forest",
    description:
      "Identify a lodgepole pine and note whether it grew post-fire or pre-fire.",
    type: "gps",
    class: "naturalist",
    xpReward: 75,
    status: "available",
    location: {
      name: "Norris Geyser Basin Forest",
      latitude: 44.7275,
      longitude: -110.7036,
      radius: 400,
    },
  },
  {
    id: "q_nat_lore_1",
    parkId: "yellowstone",
    title: "The Supervolcano",
    description:
      "Discover the secret beneath your feet — Yellowstone sits on a massive supervolcano.",
    type: "lore",
    class: "naturalist",
    xpReward: 70,
    status: "available",
    loreText:
      "Yellowstone sits on one of Earth's largest volcanic hotspots. The caldera — 34 by 45 miles — was formed 640,000 years ago by a massive eruption 1,000 times larger than Mt. St. Helens. The geysers and hot springs are powered by magma just miles beneath the surface.",
  },
  // TRACKER
  {
    id: "q_track_wolf_1",
    parkId: "yellowstone",
    title: "Wolf Pack Sighting",
    description:
      "Photograph a gray wolf or wolf tracks in the Lamar Valley — where packs roam.",
    type: "photo",
    class: "tracker",
    xpReward: 150,
    itemReward: "wolf_tooth_pendant",
    status: "available",
    photoTarget: "gray wolf or wolf tracks in snow",
  },
  {
    id: "q_track_eagle_1",
    parkId: "yellowstone",
    title: "Bald Eagle Watch",
    description:
      "Spot a bald eagle perched near a river or lake and photograph it.",
    type: "photo",
    class: "tracker",
    xpReward: 100,
    itemReward: "eagle_feather",
    status: "available",
    photoTarget: "bald eagle perched or in flight",
  },
  {
    id: "q_track_bear_1",
    parkId: "yellowstone",
    title: "Grizzly Territory",
    description:
      "Reach the Hayden Valley observation point — prime grizzly bear country.",
    type: "gps",
    class: "tracker",
    xpReward: 130,
    itemReward: "grizzly_claw",
    status: "available",
    location: {
      name: "Hayden Valley Bear Watch",
      latitude: 44.6551,
      longitude: -110.5123,
      radius: 350,
    },
  },
  {
    id: "q_track_lore_1",
    parkId: "yellowstone",
    title: "The Wolf Reintroduction",
    description:
      "Learn how wolves were brought back to Yellowstone in 1995 and changed everything.",
    type: "lore",
    class: "tracker",
    xpReward: 65,
    status: "available",
    loreText:
      "In 1995, 14 wolves were reintroduced to Yellowstone after being absent for 70 years. Their return caused a 'trophic cascade' — wolves kept elk moving, allowing riverbanks to regrow with trees, stabilizing rivers and increasing beaver populations. Predators shape entire ecosystems.",
  },
  // YELLOWSTONE ALL
  {
    id: "q_all_oldfaithful_1",
    parkId: "yellowstone",
    title: "Witness Old Faithful",
    description:
      "Be at Old Faithful when it erupts and photograph the moment it reaches full height.",
    type: "photo",
    class: "all",
    xpReward: 80,
    itemReward: "old_faithful_crystal",
    status: "available",
    photoTarget: "Old Faithful geyser at full eruption",
  },
  {
    id: "q_all_lamar_1",
    parkId: "yellowstone",
    title: "Into the Lamar Valley",
    description:
      "Journey to Lamar Valley, the American Serengeti, and take in the wildlife-rich landscape.",
    type: "gps",
    class: "all",
    xpReward: 90,
    status: "available",
    location: {
      name: "Lamar Valley Overlook",
      latitude: 44.8956,
      longitude: -110.2058,
      radius: 500,
    },
  },

  // ── GRAND TETON ────────────────────────────────────────────────
  // RANGER
  {
    id: "q_gt_ranger_patrol_1",
    parkId: "grand_teton",
    title: "Jenny Lake Shoreline Patrol",
    description:
      "Walk the patrol route around Jenny Lake's east shoreline and check for unsafe visitor activity near the water.",
    type: "gps",
    class: "ranger",
    xpReward: 85,
    itemReward: "teton_ranger_log",
    status: "available",
    location: {
      name: "Jenny Lake East Shore",
      latitude: 43.7547,
      longitude: -110.7284,
      radius: 300,
    },
  },
  {
    id: "q_gt_ranger_wildlife_1",
    parkId: "grand_teton",
    title: "Moose Meadows Report",
    description:
      "Document moose activity in Willow Flats — the most reliable moose habitat in the park.",
    type: "photo",
    class: "ranger",
    xpReward: 110,
    itemReward: "moose_sighting_report",
    status: "available",
    photoTarget: "moose in wetland meadow",
  },
  {
    id: "q_gt_ranger_lore_1",
    parkId: "grand_teton",
    title: "The Fight to Create the Park",
    description:
      "Learn why Grand Teton was the most controversial national park ever created.",
    type: "lore",
    class: "ranger",
    xpReward: 70,
    status: "available",
    loreText:
      "Unlike most parks, Grand Teton faced fierce opposition from local ranchers and Wyoming politicians for decades. After Congress failed to act, President Roosevelt used an Antiquities Act proclamation in 1943 to establish Jackson Hole National Monument. Only in 1950 did Congress finally merge it into Grand Teton National Park.",
  },
  {
    id: "q_gt_ranger_fire_1",
    parkId: "grand_teton",
    title: "Fire Lookout Post",
    description:
      "Reach the Signal Mountain fire lookout and survey the valley below for smoke or hazards.",
    type: "gps",
    class: "ranger",
    xpReward: 95,
    status: "available",
    location: {
      name: "Signal Mountain Summit",
      latitude: 43.8431,
      longitude: -110.6623,
      radius: 200,
    },
  },
  // HIKER
  {
    id: "q_gt_hiker_jenny_1",
    parkId: "grand_teton",
    title: "Jenny Lake Loop",
    description:
      "Complete the scenic Jenny Lake loop trail with iconic Teton reflections in the water.",
    type: "gps",
    class: "hiker",
    xpReward: 110,
    itemReward: "jenny_lake_stone",
    status: "available",
    location: {
      name: "Jenny Lake Trailhead",
      latitude: 43.7547,
      longitude: -110.7284,
      radius: 300,
    },
  },
  {
    id: "q_gt_hiker_inspiration_1",
    parkId: "grand_teton",
    title: "Inspiration Point",
    description:
      "Hike to Inspiration Point for the most stunning view of Jenny Lake and the valley floor.",
    type: "photo",
    class: "hiker",
    xpReward: 130,
    itemReward: "inspiration_point_badge",
    status: "available",
    photoTarget: "panoramic view from Inspiration Point overlooking Jenny Lake",
  },
  {
    id: "q_gt_hiker_snake_1",
    parkId: "grand_teton",
    title: "Snake River Overlook",
    description:
      "Reach the famous Snake River Overlook — the exact vantage point captured by Ansel Adams.",
    type: "gps",
    class: "hiker",
    xpReward: 100,
    status: "available",
    location: {
      name: "Snake River Overlook",
      latitude: 43.9041,
      longitude: -110.5739,
      radius: 200,
    },
  },
  {
    id: "q_gt_hiker_lore_1",
    parkId: "grand_teton",
    title: "The Mountain Men",
    description:
      "Discover the era of fur trappers and mountain men who first mapped these peaks.",
    type: "lore",
    class: "hiker",
    xpReward: 60,
    status: "available",
    loreText:
      "Before the park existed, French-Canadian fur trappers gave the Tetons their name: 'Les Trois Tetons' (The Three Nipples). Mountain men like Jim Bridger and Jedediah Smith explored and mapped the region in the early 1800s, trading beaver pelts and surviving brutal winters alone in the wilderness.",
  },
  // NATURALIST
  {
    id: "q_gt_nat_wildflower_1",
    parkId: "grand_teton",
    title: "Alpine Wildflower Survey",
    description:
      "Photograph Indian paintbrush and lupine wildflowers blooming along the Taggart Lake trail.",
    type: "photo",
    class: "naturalist",
    xpReward: 90,
    itemReward: "alpine_wildflower_press",
    status: "available",
    photoTarget: "Indian paintbrush and lupine wildflowers with Teton peaks behind",
  },
  {
    id: "q_gt_nat_beaver_1",
    parkId: "grand_teton",
    title: "Beaver Dam Study",
    description:
      "Find a beaver dam in Oxbow Bend and observe how beavers engineer their habitat.",
    type: "gps",
    class: "naturalist",
    xpReward: 80,
    status: "available",
    location: {
      name: "Oxbow Bend Wetlands",
      latitude: 43.8596,
      longitude: -110.5478,
      radius: 400,
    },
  },
  {
    id: "q_gt_nat_spruce_1",
    parkId: "grand_teton",
    title: "Engelmann Spruce Forest",
    description:
      "Identify Engelmann spruce trees in the subalpine zone and measure their diameter.",
    type: "photo",
    class: "naturalist",
    xpReward: 75,
    status: "available",
    photoTarget: "Engelmann spruce tree with distinctive blue-green needles",
  },
  {
    id: "q_gt_nat_lore_1",
    parkId: "grand_teton",
    title: "The Teton Fault",
    description:
      "Learn how one of the most active faults in North America built the Teton Range.",
    type: "lore",
    class: "naturalist",
    xpReward: 75,
    status: "available",
    loreText:
      "The Teton Range is geologically young and still growing. A massive fault on the east side of the range causes the mountains to rise while the Jackson Hole valley sinks — at a rate of about 1 foot per 300-400 years. In 9 million years, the peaks have risen over 30,000 feet from the valley floor, though erosion has carved them back to 13,775 ft.",
  },
  // TRACKER
  {
    id: "q_gt_track_pronghorn_1",
    parkId: "grand_teton",
    title: "Pronghorn Migration Watch",
    description:
      "Spot and photograph a pronghorn antelope — the fastest land animal in North America.",
    type: "photo",
    class: "tracker",
    xpReward: 120,
    itemReward: "pronghorn_antler_charm",
    status: "available",
    photoTarget: "pronghorn antelope on open sagebrush flats",
  },
  {
    id: "q_gt_track_osprey_1",
    parkId: "grand_teton",
    title: "Osprey Nest at Oxbow",
    description:
      "Find the osprey nesting platform at Oxbow Bend and photograph a hunting dive.",
    type: "photo",
    class: "tracker",
    xpReward: 110,
    itemReward: "osprey_feather",
    status: "available",
    photoTarget: "osprey in flight or diving into water",
  },
  {
    id: "q_gt_track_bear_1",
    parkId: "grand_teton",
    title: "Black Bear Country",
    description:
      "Reach Cascade Canyon — prime black bear territory — and look for signs of their presence.",
    type: "gps",
    class: "tracker",
    xpReward: 140,
    itemReward: "bear_claw_token",
    status: "available",
    location: {
      name: "Cascade Canyon Trailhead",
      latitude: 43.7689,
      longitude: -110.7601,
      radius: 300,
    },
  },
  {
    id: "q_gt_track_lore_1",
    parkId: "grand_teton",
    title: "Elk of Jackson Hole",
    description:
      "Learn about the world's largest elk herd, which passes through Jackson Hole each year.",
    type: "lore",
    class: "tracker",
    xpReward: 65,
    status: "available",
    loreText:
      "Each fall, over 11,000 elk migrate from Yellowstone and Grand Teton south to the National Elk Refuge in Jackson, Wyoming — one of the greatest wildlife migrations in North America. Wolves, grizzlies, and mountain lions all follow the herd. In winter, visitors can take sleigh rides through the elk herd at the refuge.",
  },
  // GRAND TETON ALL
  {
    id: "q_gt_all_reflection_1",
    parkId: "grand_teton",
    title: "The Teton Reflection",
    description:
      "Find the perfect still-morning reflection of the Teton peaks in a lake or pond.",
    type: "photo",
    class: "all",
    xpReward: 100,
    itemReward: "teton_reflection_crystal",
    status: "available",
    photoTarget: "Teton peaks reflected perfectly in still water",
  },
  {
    id: "q_gt_all_colter_bay_1",
    parkId: "grand_teton",
    title: "Colter Bay Vista",
    description:
      "Reach Colter Bay on the shore of Jackson Lake and take in the mountain panorama.",
    type: "gps",
    class: "all",
    xpReward: 85,
    status: "available",
    location: {
      name: "Colter Bay Visitor Center",
      latitude: 43.9023,
      longitude: -110.6486,
      radius: 400,
    },
  },
];

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [character, setCharacter] = useState<Character | null>(null);
  const [quests, setQuests] = useState<Quest[]>(ALL_QUESTS);
  const [activeParkId, setActiveParkId] = useState<ParkId>("yellowstone");
  const [isLoading, setIsLoading] = useState(true);
  const [allProfiles, setAllProfiles] = useState<CharacterProfile[]>([]);

  useEffect(() => { loadData(); }, []);

  // ── helpers ────────────────────────────────────────────────────
  function profileSummary(c: Character): CharacterProfile {
    return { id: c.id, name: c.name, class: c.class, gender: c.gender, level: c.level, xp: c.xp };
  }

  async function persistProfiles(profiles: CharacterProfile[]) {
    await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    setAllProfiles(profiles);
  }

  // ── load on boot ───────────────────────────────────────────────
  async function loadData() {
    try {
      const activeIdRaw = await AsyncStorage.getItem(ACTIVE_ID_KEY);

      if (activeIdRaw) {
        // New multi-profile system
        const activeId = JSON.parse(activeIdRaw) as string;
        const [cRaw, qRaw, pRaw, prRaw] = await Promise.all([
          AsyncStorage.getItem(charKey(activeId)),
          AsyncStorage.getItem(questKey(activeId)),
          AsyncStorage.getItem(parkKey(activeId)),
          AsyncStorage.getItem(PROFILES_KEY),
        ]);
        if (cRaw) setCharacter(JSON.parse(cRaw));
        if (qRaw) setQuests(JSON.parse(qRaw)); else setQuests(ALL_QUESTS);
        if (pRaw) setActiveParkId(JSON.parse(pRaw));
        if (prRaw) setAllProfiles(JSON.parse(prRaw));
      } else {
        // Migrate from old single-character storage
        const cRaw = await AsyncStorage.getItem(STORAGE_KEY);
        if (cRaw) {
          const oldChar = JSON.parse(cRaw) as Character;
          const id = oldChar.id ?? `profile_${Date.now()}`;
          const migratedChar: Character = { ...oldChar, id };
          const qRaw = await AsyncStorage.getItem(QUESTS_KEY);
          const pRaw = await AsyncStorage.getItem(PARK_KEY);
          const migratedQuests: Quest[] = qRaw ? JSON.parse(qRaw) : ALL_QUESTS;
          const migratedPark: ParkId = pRaw ? JSON.parse(pRaw) : "yellowstone";
          const profile = profileSummary(migratedChar);

          await AsyncStorage.multiSet([
            [ACTIVE_ID_KEY, JSON.stringify(id)],
            [charKey(id), JSON.stringify(migratedChar)],
            [questKey(id), JSON.stringify(migratedQuests)],
            [parkKey(id), JSON.stringify(migratedPark)],
            [PROFILES_KEY, JSON.stringify([profile])],
          ]);

          setCharacter(migratedChar);
          setQuests(migratedQuests);
          setActiveParkId(migratedPark);
          setAllProfiles([profile]);
        }
      }
    } catch (e) {
      console.error("Error loading data", e);
    } finally {
      setIsLoading(false);
    }
  }

  // ── save helpers ───────────────────────────────────────────────
  async function saveCharacter(char: Character) {
    await AsyncStorage.setItem(charKey(char.id), JSON.stringify(char));
    setCharacter(char);
    // Update profile summary list
    setAllProfiles(prev => {
      const updated = prev.map(p => p.id === char.id ? profileSummary(char) : p);
      AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(updated));
      return updated;
    });
  }

  async function saveQuests(q: Quest[], charId?: string) {
    const id = charId ?? character?.id;
    if (id) await AsyncStorage.setItem(questKey(id), JSON.stringify(q));
    setQuests(q);
  }

  async function setActivePark(parkId: ParkId) {
    if (character?.id) await AsyncStorage.setItem(parkKey(character.id), JSON.stringify(parkId));
    setActiveParkId(parkId);
  }

  // ── create new character ───────────────────────────────────────
  async function createCharacter(name: string, cls: CharacterClass, gender: CharacterGender) {
    const id = `profile_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const startingItem = CLASS_STARTING_ITEMS[cls];
    const newChar: Character = {
      id, name, class: cls, gender,
      level: 1, xp: 0, xpToNextLevel: XP_PER_LEVEL[1],
      completedQuests: [], inventory: [startingItem], activeQuests: [],
      totalPhotos: 0, totalLocationsVisited: 0, loreScrollsFound: 0,
      createdAt: new Date().toISOString(),
    };
    const newProfile = profileSummary(newChar);
    const newProfiles = [...allProfiles, newProfile];

    await AsyncStorage.multiSet([
      [ACTIVE_ID_KEY, JSON.stringify(id)],
      [charKey(id), JSON.stringify(newChar)],
      [questKey(id), JSON.stringify(ALL_QUESTS)],
      [parkKey(id), JSON.stringify("yellowstone")],
      [PROFILES_KEY, JSON.stringify(newProfiles)],
    ]);

    setCharacter(newChar);
    setQuests(ALL_QUESTS);
    setActiveParkId("yellowstone");
    setAllProfiles(newProfiles);
  }

  // ── switch to existing profile ─────────────────────────────────
  async function switchToProfile(id: string) {
    try {
      const [cRaw, qRaw, pRaw] = await Promise.all([
        AsyncStorage.getItem(charKey(id)),
        AsyncStorage.getItem(questKey(id)),
        AsyncStorage.getItem(parkKey(id)),
      ]);
      if (!cRaw) return;
      await AsyncStorage.setItem(ACTIVE_ID_KEY, JSON.stringify(id));
      setCharacter(JSON.parse(cRaw));
      setQuests(qRaw ? JSON.parse(qRaw) : ALL_QUESTS);
      setActiveParkId(pRaw ? JSON.parse(pRaw) : "yellowstone");
    } catch (e) {
      console.error("Error switching profile", e);
    }
  }

  // ── gameplay functions (unchanged logic) ───────────────────────
  async function addXP(amount: number) {
    if (!character) return;
    const newXP = character.xp + amount;
    const { level, xpToNext } = calcLevel(newXP);
    await saveCharacter({ ...character, xp: newXP, level, xpToNextLevel: xpToNext });
  }

  async function addItem(item: InventoryItem) {
    if (!character) return;
    if (character.inventory.find((i) => i.id === item.id)) return;
    await saveCharacter({ ...character, inventory: [...character.inventory, item] });
  }

  async function startQuest(questId: string) {
    if (!character) return;
    if (character.activeQuests.includes(questId)) return;
    await saveCharacter({ ...character, activeQuests: [...character.activeQuests, questId] });
  }

  async function completeQuest(questId: string) {
    if (!character) return;
    const quest = quests.find((q) => q.id === questId);
    if (!quest) return;

    const newXP = character.xp + quest.xpReward;
    const { level, xpToNext } = calcLevel(newXP);

    const updatedQuests = quests.map((q) => {
      if (q.id === questId) {
        return { ...q, status: "completed" as QuestStatus, completedAt: new Date().toISOString() };
      }
      if (q.id === "q_ranger_protect_1" && questId === "q_ranger_patrol_1") {
        return { ...q, status: "available" as QuestStatus };
      }
      return q;
    });

    let newInventory = [...character.inventory];
    if (quest.type === "lore") {
      const loreItem: InventoryItem = {
        id: `lore_${questId}`,
        name: `${quest.title} Scroll`,
        description: quest.loreText || "",
        type: "lore",
        rarity: "uncommon",
        icon: "scroll",
        acquiredAt: new Date().toISOString(),
      };
      if (!newInventory.find((i) => i.id === loreItem.id)) {
        newInventory = [...newInventory, loreItem];
      }
    }

    await saveCharacter({
      ...character,
      xp: newXP, level, xpToNextLevel: xpToNext,
      completedQuests: [...character.completedQuests, questId],
      activeQuests: character.activeQuests.filter((id) => id !== questId),
      inventory: newInventory,
      totalPhotos: quest.type === "photo" ? character.totalPhotos + 1 : character.totalPhotos,
      totalLocationsVisited: quest.type === "gps" ? character.totalLocationsVisited + 1 : character.totalLocationsVisited,
      loreScrollsFound: quest.type === "lore" ? character.loreScrollsFound + 1 : character.loreScrollsFound,
    });
    await saveQuests(updatedQuests);
  }

  async function resetGame() {
    const keysToRemove = [
      STORAGE_KEY, QUESTS_KEY, PARK_KEY, PROFILES_KEY, ACTIVE_ID_KEY,
      ...allProfiles.map(p => charKey(p.id)),
      ...allProfiles.map(p => questKey(p.id)),
      ...allProfiles.map(p => parkKey(p.id)),
    ];
    await AsyncStorage.multiRemove(keysToRemove);
    setCharacter(null);
    setQuests(ALL_QUESTS);
    setActiveParkId("yellowstone");
    setAllProfiles([]);
  }

  return (
    <GameContext.Provider
      value={{
        character, quests, activeParkId, isLoading, allProfiles,
        createCharacter, switchToProfile,
        completeQuest, addXP, addItem, startQuest, setActivePark, resetGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
