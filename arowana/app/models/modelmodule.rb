require 'util/reflection'

module Arowana
    module DBModel

        dirname = File.expand_path(File.dirname(__FILE__))
        
        include Reflection
        
        Resolver.get_rb_filepath_recursive(dirname).each { |filepath|
            Resolver.get_file_class_name(filepath).each { |klassname|
                # lazy load user model, autoload is discouraged by Matz...
                # "autoload :User, 'app/models/user'"
                autoload klassname.to_sym, filepath
            }
        }

    end
end