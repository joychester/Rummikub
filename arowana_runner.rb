require 'git'
require 'fileutils'
require 'sys/proctable'

$: << File.expand_path(File.dirname(__FILE__))

git_repo = 'https://github.com/joychester/Rummikub.git'

target_dir = './arowana'


if ! Dir.exist?(target_dir)
    p 'cloning dir from github repo...'
    g = Git.clone(git_repo, target_dir)
else
    'old dir found, removing it...'
    FileUtils.remove_entry(target_dir)
    p 'cloning dir from github repo...'
    g = Git.clone(git_repo, target_dir)
end

# exec 'bundle install and rackup config.ru'
Dir.chdir('./arowana') do
    `bundle install`
    
    # check postgresql service if running
    pg_service = Sys::ProcTable.ps.select { |process|
        process.include?('postgres')
    }
    if pg_service.empty?
        p 'postgresql process is not found, will help you start postgresql service...'
        `sudo service postgresql start`
    end
    
    p 'ready to start your Arowana App...'
    `rackup config.ru -p $PORT -o $IP`
end
