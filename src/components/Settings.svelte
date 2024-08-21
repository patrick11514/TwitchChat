<script lang="ts">
    import { invoke } from '@tauri-apps/api';

    export const logout = async () => {
        const result = await invoke('logout');
    };
</script>

Nastavenííí :))))
