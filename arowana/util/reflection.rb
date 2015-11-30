require 'find'

module Reflection
    class Resolver

        def self.get_file_class_name(fpath)
            klassname = Array.new
            
            File.open(fpath) do |file|
                file.readlines.each do |line|
                    if line =~ /class\s/
                        arr = line.strip!.split
                        k_name = arr[1].include?('<') ? arr[1].split('<')[0] : arr[1]
                        klassname << k_name
                    end
                end
            end
        
            return klassname
        end
        
        def self.get_rb_filepath(dir)
            rbfilepath = Array.new
        
            Dir.foreach(dir) { |file|
                if File.extname(file).eql? '.rb'
                    fullpath = dir + '/' + file
                    rbfilepath << fullpath
                end
            }
            return rbfilepath
        end
        
        def self.get_rb_filepath_recursive(dir)
            rbfilepath = Array.new
            Find.find(dir) do |path|
                rbfilepath << path if path =~ /.*\.rb$/
            end
            return rbfilepath
        end
        
        def self.get_all_klass_name(dir_path)
            get_rb_filepath_recursive(dir_path).each { |filepath|
                get_file_class_name(filepath).each { |klassname|
                    begin
                        yield(klassname,filepath)
                    rescue Exception => msg   
                        LOGGER.warn("#{msg}")
                    end
                }
            }
        end
        
        def self.get_mod_name(obj)
            obj.to_s
        end

    end
end