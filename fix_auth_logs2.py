import re

with open('src/contexts/RuntimeContext.tsx', 'r') as f:
    content = f.read()

target_effect = """  useEffect(() => {
    let mounted = true;
    const initializeAuth = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get('code');
        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (e) {}

      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        await loadUserProfile(data.session.user);
      }
      setIsLoading(false);
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'INITIAL_SESSION') return;
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsLoading(true);
        loadUserProfile(session.user).finally(() => {
          if (mounted) setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserProfile]);"""

replacement_effect = """  useEffect(() => {
    let mounted = true;
    const initializeAuth = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get('code');
        if (code) {
          console.log("[AUTH] User selected account");
          await supabase.auth.exchangeCodeForSession(code);
          console.log("[AUTH] Authentication successful");
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (e) {}

      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (data.session?.user) {
        console.log("[AUTH] Found existing session");
      }
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        await loadUserProfile(data.session.user);
      }
      setIsLoading(false);
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`[AUTH] Auth state changed: ${event}`);
      if (!mounted) return;
      if (event === 'INITIAL_SESSION') return;
      if (event === 'SIGNED_IN') {
        console.log("[AUTH] Authentication successful");
      }
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsLoading(true);
        loadUserProfile(session.user).finally(() => {
          if (mounted) setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserProfile]);"""

content = content.replace(target_effect, replacement_effect)

with open('src/contexts/RuntimeContext.tsx', 'w') as f:
    f.write(content)
