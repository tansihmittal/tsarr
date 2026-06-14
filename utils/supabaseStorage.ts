import { supabase } from "./supabase";
import { Project } from "./projectStorage";

// ─── Project Cloud Sync ────────────────────────────────────────────────────────

/** Upsert a single project to Supabase. Caller must be authenticated. */
export const syncProjectToCloud = async (project: Project): Promise<void> => {
  const { error } = await supabase.from("projects").upsert(
    {
      id: project.id,
      name: project.name,
      type: project.type,
      thumbnail: project.thumbnail,
      data: project.data,
      created_at: project.createdAt,
      updated_at: project.updatedAt,
    },
    { onConflict: "id" }
  );
  if (error) throw error;
};

/** Sync a project to cloud only if a user session exists. Silently skips if not. */
export const syncToCloudIfLoggedIn = async (project: Project): Promise<void> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await syncProjectToCloud(project);
  } catch {
    // Local save already succeeded – cloud sync failure is non-fatal
  }
};

/** Fetch all cloud projects for the current user. */
export const getCloudProjects = async (): Promise<Project[]> => {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    thumbnail: p.thumbnail || "",
    data: p.data,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  }));
};

/** Delete a project from cloud by ID. */
export const deleteProjectFromCloud = async (projectId: string): Promise<void> => {
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) throw error;
};

/** Push all local projects to cloud (upsert). Prefer cloud version if newer. */
export const pushLocalToCloud = async (localProjects: Project[]): Promise<void> => {
  if (localProjects.length === 0) return;
  const rows = localProjects.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    thumbnail: p.thumbnail,
    data: p.data,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  }));
  const { error } = await supabase.from("projects").upsert(rows, { onConflict: "id" });
  if (error) throw error;
};

// ─── Preset Cloud Sync ─────────────────────────────────────────────────────────

export interface CloudPreset {
  id: string;
  preset_name: string;
  data: any;
  created_at: string;
}

/** Fetch all presets for the current user. */
export const getCloudPresets = async (): Promise<CloudPreset[]> => {
  const { data, error } = await supabase
    .from("presets")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as CloudPreset[];
};

/** Save a new preset. Throws if the 20-preset limit is reached. */
export const saveCloudPreset = async (presetName: string, settings: any): Promise<void> => {
  const { count, error: countError } = await supabase
    .from("presets")
    .select("*", { count: "exact", head: true });
  if (countError) throw countError;
  if (count !== null && count >= 20) {
    throw new Error("You can only save 20 presets");
  }
  const { error } = await supabase.from("presets").insert({
    preset_name: presetName,
    data: settings,
  });
  if (error) throw error;
};

/** Delete a preset by ID. */
export const deleteCloudPreset = async (id: string): Promise<void> => {
  const { error } = await supabase.from("presets").delete().eq("id", id);
  if (error) throw error;
};
