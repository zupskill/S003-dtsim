import { supabase } from "../supabase";

export async function getOrCreateUser() {
  try {
    const authUserResponse = await supabase.auth.getUser();
    const authUser = authUserResponse.data?.user;
    
    if (!authUser) {
      return null;
    }

    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching user:", fetchError);
      return null;
    }

    if (existingUser) {
      return existingUser;
    }

    const newUserPayload = {
      id: authUser.id,
      email: authUser.email,
      full_name: authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? null,
      avatar_url: authUser.user_metadata?.avatar_url ?? authUser.user_metadata?.picture ?? null,
    };

    const { data: insertedUser, error: insertError } = await supabase
      .from("users")
      .insert(newUserPayload)
      .select("*")
      .maybeSingle();

    if (insertError) {
      if (insertError.code === "23505") {
        // Unique constraint violation (duplicate logic), fetch again
        const { data: retryUser, error: retryError } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .maybeSingle();
        
        if (retryError || !retryUser) {
          console.error("Error fetching user after duplicate violation:", retryError);
          return null;
        }
        return retryUser;
      }
      console.error("Error inserting user:", insertError);
      return null;
    }

    return insertedUser;
  } catch (err) {
    console.error("Unexpected error in getOrCreateUser:", err);
    return null;
  }
}
