pub mod utils {
    use std::path::PathBuf;

    use tauri::api::path::home_dir;

    pub fn get_directory() -> Option<PathBuf> {
        match home_dir() {
            Some(path) => {
                let mut path = path;
                path.push(".local/share/RustTwitchChat");
                Some(path)
            }
            None => None,
        }
    }
}
