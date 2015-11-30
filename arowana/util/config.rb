require 'logger'

#load global config file
CONFIG = YAML.load_file('conf/config.yml')

#Connect to Postgresql service
DB = Sequel.connect(CONFIG['dbconnect'])
Sequel.database_timezone = :utc

#Set STDOUT as default
log_path = CONFIG['loggerpath']
if log_path != nil
    LOGGER = Logger.new(log_path)
else
    LOGGER = Logger.new(STDOUT)
end

LOGGERLEVEL = CONFIG['loggerlevel'].upcase
if LOGGERLEVEL.eql? 'DEBUG'
	LOGGER.level = Logger::DEBUG
elsif LOGGERLEVEL.eql? 'INFO'
	LOGGER.level = Logger::INFO
elsif LOGGERLEVEL.eql? 'WARN'
	LOGGER.level = Logger::WARN
else
	LOGGER.level = Logger::ERROR
end