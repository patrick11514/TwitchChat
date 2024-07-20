// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod config;
mod utils;

use std::fs;

use config::config::Config;
use utils::utils::*;

use dotenv::dotenv;
use twitch_irc::{
    login::StaticLoginCredentials, ClientConfig, SecureTCPTransport, TwitchIRCClient,
};

#[derive(Debug, thiserror::Error)]
enum Error {
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error("{0}")]
    Other(String),
    #[error(transparent)]
    Any(#[from] anyhow::Error),
}

impl serde::Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn logged() -> Result<bool, Error> {
    match get_directory() {
        Some(path) => {
            if !path.exists() {
                fs::create_dir(path.clone())?;
            }
            Ok(Config::exists(path))
        }
        None => Err(Error::Other("Unable to get home directory".into())),
    }
}

fn main() {
    dotenv().ok();

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![logged])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
