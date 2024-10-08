#[allow(dead_code)]
pub mod config {
    use std::{
        fs::{self},
        path::PathBuf,
        str,
    };

    use serde::{Deserialize, Serialize};

    #[derive(Serialize, Deserialize)]
    pub struct Config {
        username: String,
        display_name: String,
        token: String,
    }

    fn get_config_directory(mut program_directory: PathBuf) -> PathBuf {
        program_directory.push("config.json");
        program_directory
    }

    impl Config {
        pub fn new(username: String, display_name: String, token: String) -> Self {
            Config {
                username,
                display_name,
                token,
            }
        }

        pub fn delete(program_directory: PathBuf) -> Result<(), anyhow::Error> {
            fs::remove_file(get_config_directory(program_directory))?;

            Ok(())
        }

        pub fn write(self, program_directory: PathBuf) -> Result<(), anyhow::Error> {
            let str = serde_json::to_string(&self)?;

            fs::write(get_config_directory(program_directory), str.as_bytes())?;

            Ok(())
        }

        pub fn from_file(program_directory: PathBuf) -> Result<Self, anyhow::Error> {
            let result = fs::read(get_config_directory(program_directory))?;

            Ok(serde_json::from_str(str::from_utf8(&result)?)?)
        }

        pub fn get_token(&self) -> String {
            self.token.clone()
        }

        pub fn get_username(&self) -> String {
            self.username.clone()
        }

        pub fn get_display_name(&self) -> String {
            self.display_name.clone()
        }

        pub fn exists(program_directory: PathBuf) -> bool {
            get_config_directory(program_directory).exists()
        }
    }
}
