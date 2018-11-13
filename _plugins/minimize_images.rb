require "tinify"

Tinify.key = ENV['TINYPNG_KEY']

compressedImages = Hash.new

File.foreach('compressed_images.dat').with_index do |line, line_num|
    # puts "#{line_num}: #{line}"
    compressedImages[line.chomp] = true
 end

Dir.foreach('uploads') do |item|
    next if item == '.' or item == '..'
    # do work on real items
    puts 'checking uploads/'+item+'...'
    if compressedImages.has_key?(item)
        puts 'uploads/'+item+' is already compressed, skipping...'
    elsif item.end_with? ".jpg" or item.end_with? ".jpeg" or item.end_with? ".JPG" or item.end_with? ".JPEG" or item.end_with? ".png" or item.end_with? ".PNG"
        source = Tinify.from_file('uploads/'+item)
        source.to_file('uploads/'+item)
        compressedImages[item] = true
        puts 'finished compressing uploads/'+item
    else
        puts 'pass unsupported file '+item
    end
end

File.open('compressed_images.dat', "w") do |f|
    compressedImages.keys.each { |element| f.puts element }
end