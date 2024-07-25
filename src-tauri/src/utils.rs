#[allow(dead_code)]
pub mod utils {
    use std::{
        env::{self, VarError},
        path::PathBuf,
    };

    use serde::{Deserialize, Serialize};
    use tauri::api::path::home_dir;

    #[derive(Debug, thiserror::Error)]
    pub enum Error {
        #[error(transparent)]
        Io(#[from] std::io::Error),
        #[error("{0}")]
        Other(String),
        #[error(transparent)]
        Any(#[from] anyhow::Error),
        #[error(transparent)]
        Env(#[from] VarError),
        #[error(transparent)]
        Serde(#[from] serde_json::Error),
    }

    impl serde::Serialize for Error {
        fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
        where
            S: serde::ser::Serializer,
        {
            serializer.serialize_str(self.to_string().as_ref())
        }
    }

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

    #[derive(Serialize, Deserialize)]
    pub struct TwitchTokenResponse {
        access_token: String,
        expires_in: u8,
        refresh_token: String,
    }

    #[derive(Serialize, Deserialize, Clone)]
    pub struct TwitchResponse<T> {
        data: Vec<T>,
    }

    #[derive(Serialize, Deserialize, Clone)]
    pub struct TwitchUserData {
        id: String,
        login: String,
        display_name: String,
    }

    impl<T: Clone> TwitchResponse<T> {
        pub fn get_data(&self) -> Vec<T> {
            self.data.to_vec()
        }
    }

    impl TwitchUserData {
        pub fn get_id(&self) -> String {
            self.id.clone()
        }

        pub fn get_login(&self) -> String {
            self.login.clone()
        }

        pub fn get_display_name(&self) -> String {
            self.display_name.clone()
        }
    }

    pub async fn get_user_info(
        token: String,
    ) -> Result<TwitchResponse<TwitchUserData>, anyhow::Error> {
        let client = reqwest::Client::new();
        let response = client
            .get("https://api.twitch.tv/helix/users")
            .header("Client-Id", env::var("PUBLIC_CLIENT_ID")?)
            .header("Authorization", format!("Bearer {}", token))
            .send()
            .await?;

        let text = response.text().await?;

        Ok(serde_json::from_str(text.as_str())?)
    }
}
