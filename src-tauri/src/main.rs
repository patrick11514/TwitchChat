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

#[tauri::command]
async fn save_token(auth: String) -> Result<(), Error> {
    let user_data = get_user_info(auth.clone()).await?;
    let user_data = user_data.get_data();
    if user_data.len() > 1 {
        return Err(Error::Other("Cannot get user info".into()));
    }

    let user_data = match user_data.first() {
        Some(data) => data,
        None => {
            return Err(Error::Other("Cannot get user info".into()));
        }
    };

    let config = Config::new(user_data.get_login(), user_data.get_display_name(), auth);

    match get_directory() {
        Some(path) => {
            if !path.exists() {
                fs::create_dir(path.clone())?;
            }
            config.write(path)?;
            Ok(())
        }
        None => Err(Error::Other("Unable to get home directory".into())),
    }
}
fn main() {
    dotenv().ok();

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![logged, save_token])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
