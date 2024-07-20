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

    pub async fn get_token_from_twitch(auth: String) -> Result<(), anyhow::Error> {
        let url: &str = "https://id.twitch.tv/oauth2/token";
        let client = reqwest::Client::new();

        let response = match client
            .post(url)
            .body(format!(
            "client_id={}&client_secret={}&code={}&grant_type=authorization_code&redirect_uri={}",
            env::var("PUBLIC_CLIENT_ID")?,
            env::var("CLIENT_SECRET")?,
            auth,
            env::var("PUBLIC_REDIRECT_URI")?
        ))
            .header("Content-Type", "application/x-www-form-urlencoded")
            .send()
            .await
        {
            Ok(response) => Ok(response),
            Err(_) => Err(Error::Other("Unable to fetch".into())),
        }?;

        let response = match response.text().await {
            Ok(response) => Ok(response),
            Err(_) => Err(Error::Other("Unable to get text".into())),
        }?;

        println!("{}", response);

        let result: TwitchTokenResponse = serde_json::from_str(response.as_str())?;

        println!("{}", result.expires_in);

        Ok(())
    }
}
